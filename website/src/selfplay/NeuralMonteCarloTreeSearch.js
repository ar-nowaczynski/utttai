import { InferenceSession, Tensor, env } from 'onnxruntime-web';
import { isMobileDevice } from '../global/device';
import { sleep } from '../global/sleeping';
import { getStateArray324, FLAT_INDEX_0 } from '../game/helpers';
import NeuralMonteCarloTreeSearchError from './NeuralMonteCarloTreeSearchError';
import { softmax } from './helpers';

export default class NeuralMonteCarloTreeSearch {
  constructor(
    uttt,
    numSimulations,
    explorationStrength,
    updateCurrentNumSimulations,
    updateEvaluatedStateValueMean,
    updateEvaluatedActionsGrouped,
    autoSelectNextAction,
    isEvaluationDisabled
  ) {
    this.createTree(uttt);
    this.numSimulations = numSimulations;
    this.explorationStrength = explorationStrength;
    this.policyValueNetSession = null;
    this.runSimulationTimerId = null;
    this.autoSelectionTimerId = null;
    this.updateCurrentNumSimulations = updateCurrentNumSimulations;
    this.updateEvaluatedStateValueMean = updateEvaluatedStateValueMean;
    this.updateEvaluatedActionsGrouped = updateEvaluatedActionsGrouped;
    this.autoSelectNextAction = autoSelectNextAction;
    this.isEvaluationDisabled = isEvaluationDisabled;
    this.simulationFlag = false;
    this.synchronizationFlag = false;
    this.synchronizeCallbacksQueue = [];
    this.synchronizeStartSimulationsFlag = false;
    this.policyValueNetSessionLoadingFlag = false;
    this.policyValueNetSessionUnavailabilityFlag = false;
    this.evaluationUpdateIters = isMobileDevice() ? 1 : 10;
  }

  async simulate() {
    const selectedPath = this.selectLeafNode();
    if (selectedPath.length === 0) {
      throw new NeuralMonteCarloTreeSearchError('selected path is empty');
    }
    const leafNode = selectedPath[selectedPath.length - 1];
    leafNode.expand();
    await this.evaluate(leafNode);
    this.backprop(selectedPath, leafNode.stateValue);
  }

  selectLeafNode() {
    const selectedPath = [];
    let node = this.tree.root;
    while (!node.isLeaf()) {
      selectedPath.push(node);
      const scores = node.childNodes.map(
        (childNode) =>
          -childNode.stateValueMean +
          (this.explorationStrength * Math.max(0.01, childNode.actionProbability) * Math.sqrt(node.visitCount)) /
            (childNode.visitCount + 1)
      );
      const topScore = Math.max(...scores);
      const topScoreIndices = scores
        .map((score, index) => [score, index])
        .filter((score_index) => score_index[0] >= topScore)
        .map((score_index) => score_index[1]);
      const topChildNodeIndex = topScoreIndices[Math.floor(Math.random() * topScoreIndices.length)];
      node = node.childNodes[topChildNodeIndex];
    }
    selectedPath.push(node);
    return selectedPath;
  }

  async evaluate(node) {
    if (node.isTerminal()) {
      if (node.uttt.isResultDraw()) {
        node.stateValue = 0.0;
      } else {
        node.stateValue = -1.0;
      }
      return;
    }
    const stateArray324 = getStateArray324(node.uttt);
    const inputTensor1x4x9x9 = new Tensor('float32', stateArray324, [1, 4, 9, 9]);
    const feeds = { input: inputTensor1x4x9x9 };
    const predictions = await this.policyValueNetSession.run(feeds);
    const policyLogitsArray81 = predictions.policy_logits.data;
    const stateValueArray = predictions.state_value.data;
    const policyLogitsArray = [];
    for (const childNode of node.childNodes) {
      const actionIndex = childNode.action.index;
      const actionLogit = policyLogitsArray81[FLAT_INDEX_0[actionIndex]];
      policyLogitsArray.push(actionLogit);
    }
    const policyProbasArray = softmax(policyLogitsArray);
    for (let i = 0; i < node.childNodes.length; i++) {
      node.childNodes[i].actionProbability = policyProbasArray[i];
    }
    node.stateValue = stateValueArray[0];
  }

  backprop(selectedPath, stateValue) {
    let sign = 1;
    for (let i = selectedPath.length - 1; i >= 0; i--) {
      selectedPath[i].visitCount += 1;
      selectedPath[i].stateValueSum += sign * stateValue;
      selectedPath[i].stateValueMean = selectedPath[i].stateValueSum / selectedPath[i].visitCount;
      sign *= -1;
    }
  }

  async runSimulation() {
    if (this.simulationFlag) {
      await this.simulate();
      this.scheduleSimulation();
    } else {
      this.runSimulationTimerId = null;
      return;
    }
  }

  scheduleSimulation() {
    this.updateCurrentNumSimulations();
    if (this.tree.root.visitCount % this.evaluationUpdateIters === 0 || this.tree.root.visitCount === 1) {
      this.updateEvaluatedStateValueMean();
      this.updateEvaluatedActionsGrouped();
    }
    if (
      (this.tree.root.visitCount < this.numSimulations &&
        !this.tree.root.isTerminal() &&
        !this.isEvaluationDisabled(this.tree.root.uttt)) ||
      this.tree.root.visitCount === 0
    ) {
      this.runSimulationTimerId = setTimeout(() => this.runSimulation(), 0);
    } else {
      this.runSimulationTimerId = null;
      this.simulationFlag = false;
      if (this.tree.root.visitCount >= this.numSimulations && !this.tree.root.isTerminal()) {
        setTimeout(() => this.autoSelectNextAction(), 0);
      }
    }
  }

  startSimulations() {
    if (!this.simulationFlag) {
      this.simulationFlag = true;
      this.scheduleSimulation();
    }
  }

  async stopSimulations() {
    this.simulationFlag = false;
    let sleepingDuration = 1;
    while (this.runSimulationTimerId !== null) {
      await sleep(sleepingDuration);
      if (sleepingDuration < 100) {
        sleepingDuration += 1;
      }
    }
  }

  async synchronize(synchronizeCallback, startSimulationsFlag, waitForSessionFlag) {
    this.synchronizeCallbacksQueue.push(synchronizeCallback);
    let sleepingDuration = 10;
    while (this.policyValueNetSession === null) {
      if (!waitForSessionFlag) {
        return;
      }
      if (this.policyValueNetSessionUnavailabilityFlag) {
        return;
      }
      await sleep(sleepingDuration);
      if (sleepingDuration < 1000) {
        sleepingDuration += 10;
      }
    }
    this.synchronizeStartSimulationsFlag = startSimulationsFlag;
    if (this.synchronizationFlag) {
      return;
    }
    this.synchronizationFlag = true;
    this.cancelAutoSelection();
    await this.stopSimulations();
    while (this.synchronizeCallbacksQueue.length > 0) {
      synchronizeCallback = this.synchronizeCallbacksQueue.shift();
      if (synchronizeCallback) {
        await synchronizeCallback();
      }
    }
    if (this.synchronizeStartSimulationsFlag) {
      this.startSimulations();
    }
    this.synchronizationFlag = false;
  }

  cancelAutoSelection() {
    if (this.autoSelectionTimerId !== null) {
      clearTimeout(this.autoSelectionTimerId);
      this.autoSelectionTimerId = null;
      this.updateEvaluatedActionsGrouped();
    }
  }

  async createPolicyValueNetSession(updateLoadingStatus) {
    if (this.policyValueNetSessionLoadingFlag) {
      return;
    }
    this.policyValueNetSessionLoadingFlag = true;
    let wasmLoadingProgress = 0;
    const showLoadingStatusTimerID = setTimeout(
      () => updateLoadingStatus({ loading: true, progress: wasmLoadingProgress }),
      0
    );
    const wasmLoadingProgressTimerID = setInterval(() => {
      if (wasmLoadingProgress < 0.099) {
        wasmLoadingProgress += 0.01;
      }
      updateLoadingStatus({ loading: true, progress: wasmLoadingProgress });
    }, 1000);
    try {
      const initResponse = await fetch('/init.onnx');
      const initArrayBuffer = await initResponse.arrayBuffer();
      await InferenceSession.create(initArrayBuffer, {
        executionProviders: ['wasm'],
      });
      clearTimeout(wasmLoadingProgressTimerID);
      if (env && env.wasm && env.wasm.simd) {
        const response = await fetch('/policy_value_net_stage2.onnx');
        const contentLength = 19983650;
        let receivedLength = 0;
        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          chunks.push(value);
          receivedLength += value.length;
          const pvnLoadingProgress = receivedLength / contentLength;
          updateLoadingStatus({
            loading: true,
            progress: wasmLoadingProgress + (1 - wasmLoadingProgress) * pvnLoadingProgress,
          });
        }
        const arrayBuffer = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          arrayBuffer.set(chunk, position);
          position += chunk.length;
        }
        this.policyValueNetSession = await InferenceSession.create(arrayBuffer, {
          executionProviders: ['wasm'],
        });
      } else {
        throw new NeuralMonteCarloTreeSearchError('ort-wasm-simd is not supported');
      }
    } catch (e) {
      console.log(e);
      clearTimeout(wasmLoadingProgressTimerID);
      clearTimeout(showLoadingStatusTimerID);
      setTimeout(() => updateLoadingStatus({ error: true }), 1000);
      this.policyValueNetSessionUnavailabilityFlag = true;
      return;
    }
    clearTimeout(showLoadingStatusTimerID);
    updateLoadingStatus({ success: true });
  }

  createTree(uttt) {
    this.tree = new Tree(new Node(uttt));
  }
}

class Tree {
  constructor(root) {
    this.root = root;
  }

  clone() {
    return new Tree(this.root.clone());
  }

  synchronize(uttt) {
    for (const childNode of this.root.childNodes) {
      if (uttt.isEqualTo(childNode.uttt)) {
        this.root = childNode.clone();
        return;
      }
    }
    this.root = new Node(uttt.clone());
  }
}

class Node {
  constructor(uttt, action = null) {
    this.uttt = uttt;
    this.action = action;
    this.actionProbability = null;
    this.childNodes = [];
    this.visitCount = 0;
    this.stateValue = null;
    this.stateValueSum = 0.0;
    this.stateValueMean = 0.0;
  }

  clone() {
    const node = new Node(this.uttt.clone(), this.action);
    node.actionProbability = this.actionProbability;
    node.childNodes = [];
    node.visitCount = this.visitCount;
    node.stateValue = this.stateValue;
    node.stateValueSum = this.stateValueSum;
    node.stateValueMean = this.stateValueMean;
    for (const childNode of this.childNodes) {
      node.childNodes.push(childNode.clone());
    }
    return node;
  }

  isLeaf() {
    return this.childNodes.length === 0;
  }

  isTerminal() {
    return this.uttt.isTerminated();
  }

  expand() {
    if (!this.isLeaf()) {
      return;
    } else if (this.isTerminal()) {
      return;
    }
    const legalActions = this.uttt.getLegalActions();
    if (legalActions.length === 0) {
      throw new NeuralMonteCarloTreeSearchError('expanding node with no legal actions');
    }
    for (const legalAction of legalActions) {
      const uttt = this.uttt.clone();
      uttt.execute(legalAction, false);
      const childNode = new Node(uttt, legalAction);
      this.childNodes.push(childNode);
    }
  }

  isUnevaluated() {
    return this.visitCount === 0 && !this.isTerminal();
  }

  getCurrentNumSimulations() {
    return this.visitCount;
  }

  getEvaluatedStateValueMean() {
    return this.stateValueMean;
  }

  getEvaluatedActionsGrouped() {
    const policyPredictionWeight = Math.max(0, -0.1 * this.visitCount + 100);
    const denominator = this.visitCount + policyPredictionWeight - 1;
    const evaluatedActionsGrouped = {};
    let topProbability = 0.0;
    for (const childNode of this.childNodes) {
      const probability = (childNode.visitCount + childNode.actionProbability * policyPredictionWeight) / denominator;
      const subgame = Math.floor(childNode.action.index / 9);
      if (!(subgame in evaluatedActionsGrouped)) {
        evaluatedActionsGrouped[subgame] = {};
      }
      evaluatedActionsGrouped[subgame][childNode.action.index] = {
        probability: probability,
        top: false,
      };
      topProbability = Math.max(probability, topProbability);
    }
    const topProbabilityThreshold = topProbability * 0.5;
    for (const subgame in evaluatedActionsGrouped) {
      for (const index in evaluatedActionsGrouped[subgame]) {
        evaluatedActionsGrouped[subgame][index].top =
          evaluatedActionsGrouped[subgame][index].probability >= topProbabilityThreshold;
      }
    }
    return evaluatedActionsGrouped;
  }
}
