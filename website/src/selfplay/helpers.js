function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const scores = logits.map((l) => Math.exp(l - maxLogit));
  const scoresSum = scores.reduce((a, b) => a + b);
  return scores.map((s) => s / scoresSum);
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function selectIndex(evaluatedActionsGrouped, selectionMethod) {
  if (selectionMethod === 'ARGMAX') {
    return argmaxIndex(evaluatedActionsGrouped);
  } else if (selectionMethod === 'SAMPLE') {
    return sampleIndex(evaluatedActionsGrouped);
  }
}

function argmaxIndex(evaluatedActionsGrouped) {
  let topProbability = 0.0;
  let indexes = [];
  for (const subgame in evaluatedActionsGrouped) {
    for (const index in evaluatedActionsGrouped[subgame]) {
      if (evaluatedActionsGrouped[subgame][index].probability > topProbability) {
        topProbability = evaluatedActionsGrouped[subgame][index].probability;
        indexes = [Number(index)];
      } else if (evaluatedActionsGrouped[subgame][index].probability === topProbability) {
        indexes.push(Number(index));
      }
    }
  }
  if (indexes.length === 1) {
    return indexes[0];
  } else if (indexes.length > 1) {
    const indexesSum = indexes.reduce((a, b) => a + b, 0);
    return indexes[indexesSum % indexes.length];
  }
}

function sampleIndex(evaluatedActionsGrouped) {
  let p = Math.random();
  let probabilityCumSum = 0;
  for (const subgame in evaluatedActionsGrouped) {
    for (const index in evaluatedActionsGrouped[subgame]) {
      probabilityCumSum += evaluatedActionsGrouped[subgame][index].probability;
      if (p < probabilityCumSum) {
        return Number(index);
      }
    }
  }
  return randomIndex(evaluatedActionsGrouped);
}

function randomIndex(evaluatedActionsGrouped) {
  const indexes = [];
  for (const subgame in evaluatedActionsGrouped) {
    for (const index in evaluatedActionsGrouped[subgame]) {
      indexes.push(Number(index));
    }
  }
  return randomChoice(indexes);
}

export { softmax, selectIndex };
