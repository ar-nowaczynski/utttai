#include <torch/script.h>
#include <torch/torch.h>

#include <atomic>
#include <chrono>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <random>
#include <sstream>
#include <stdexcept>
#include <thread>
#include <vector>

#include "utttcpp/game/action.hpp"
#include "utttcpp/game/constants.hpp"
#include "utttcpp/game/ultimateTicTacToe.hpp"
#include "utttcpp/selfplay/neuralMonteCarloTreeSearchWorker.hpp"

using utttcpp::Action;

using utttcpp::X_STATE_VALUE;
using utttcpp::O_STATE_VALUE;
using utttcpp::STATE_SIZE;

using utttcpp::UltimateTicTacToe;

using utttcpp::NeuralMonteCarloTreeSearchWorker;
using utttcpp::EvaluatedState;
using utttcpp::serializeEvaluatedState;
using utttcpp::EvaluatedAction;
using utttcpp::serializeEvaluatedActions;

const auto TASK_MANAGER_SLEEP_DURATION = std::chrono::milliseconds(200);
const auto NMCTS_WORKER_WAITING_FOR_TASK_SLEEP_DURATION = std::chrono::milliseconds(100);
const auto NMCTS_WORKER_WAITING_FOR_PREDICTION_SLEEP_DURATION = std::chrono::milliseconds(2);
const auto PREDICTOR_SLEEP_DURATION = std::chrono::milliseconds(1);

const int NMCTS_WORKER_WAITING_SIGNAL = -1;
const int NMCTS_WORKER_CLOSING_SIGNAL = -2;

int parseInt(char *argv) {
    int number;
    std::stringstream stream(argv);
    stream >> number;
    return number;
}

std::string parseString(char *argv) {
    return std::string(argv);
}

void loadTaskList(std::vector<std::string> *tasks, const std::string taskListPath) {
    std::string line;
    std::ifstream ifs(taskListPath);
    while (std::getline(ifs, line)) {
        tasks->push_back(line);
    }
}

void parseTask(const std::string *task,
               std::string *utttState,
               int *numSimulations,
               double *explorationStrength,
               uint32_t *randomSeed,
               std::string *outputPath) {
    std::istringstream iss(*task);
    if (!(iss >> *utttState)) {
        throw std::runtime_error("cannot parse utttState");
    }
    if (!(iss >> *numSimulations)) {
        throw std::runtime_error("cannot parse numSimulations");
    }
    if (!(iss >> *explorationStrength)) {
        throw std::runtime_error("cannot parse explorationStrength");
    }
    if (!(iss >> *randomSeed)) {
        throw std::runtime_error("cannot parse randomSeed");
    }
    if (!(iss >> *outputPath)) {
        throw std::runtime_error("cannot parse outputPath");
    }
}

UltimateTicTacToe *parseUttt(const std::string utttState) {
    unsigned char *state = new unsigned char[STATE_SIZE];
    int stateValue;
    for (int i = 0; i < STATE_SIZE; i++) {
        stateValue = utttState[i] - '0';
        if (stateValue < 0 || stateValue > 9) {
            throw std::runtime_error("invalid state value");
        }
        state[i] = (unsigned char)stateValue;
    }
    UltimateTicTacToe *uttt = new UltimateTicTacToe();
    uttt->setState(state);
    delete[] state;
    return uttt;
}

void taskManager(const int numWorkers,
                 const std::vector<std::string> &tasks,
                 std::atomic_int *workerTaskAssignments,
                 std::atomic_int *numActiveWorkers,
                 std::atomic_bool *predictorClosingSignal) {
    std::cout << ("taskManager | started\n");
    const int numTasks = tasks.size();
    int nextTaskIndex = 0;
    // assign task to workers until all tasks are dispatched:
    while (nextTaskIndex < numTasks) {
        for (int workerId = 0; workerId < numWorkers; workerId++) {
            if (workerTaskAssignments[workerId].load() == NMCTS_WORKER_WAITING_SIGNAL) {
                std::cout << ("taskManager | assign task[" + std::to_string(nextTaskIndex) + "]: "
                    + tasks[nextTaskIndex] + " to workerId=[" + std::to_string(workerId) + "]\n");
                workerTaskAssignments[workerId].store(nextTaskIndex++);
                if (nextTaskIndex >= numTasks) {
                    break;
                }
            }
        }
        std::this_thread::sleep_for(TASK_MANAGER_SLEEP_DURATION);
    }
    std::cout << ("taskManager | all tasks dispatched\n");
    std::cout << ("taskManager | numActiveWorkers: "
        + std::to_string(numActiveWorkers->load()) + "\n");
    // send closing signal to workers:
    while (numActiveWorkers->load() > 0) {
        for (int workerId = 0; workerId < numWorkers; workerId++) {
            if (workerTaskAssignments[workerId].load() == NMCTS_WORKER_WAITING_SIGNAL) {
                std::cout << ("taskManager | closing worker[" + std::to_string(workerId) + "]\n");
                workerTaskAssignments[workerId].store(NMCTS_WORKER_CLOSING_SIGNAL);
                numActiveWorkers->fetch_sub(1);
                std::cout << ("taskManager | numActiveWorkers: "
                    + std::to_string(numActiveWorkers->load()) + "\n");
            }
        }
        std::this_thread::sleep_for(TASK_MANAGER_SLEEP_DURATION);
    }
    // send closing signal to predictor:
    std::cout << ("taskManager | closing predictor\n");
    predictorClosingSignal->store(true);
    // terminate taskManager thread:
    std::cout << ("taskManager | return;\n");
    return;
}

void nmctsWorker(const int workerId,
                 const std::vector<std::string> &tasks,
                 std::atomic_int *workerTaskAssignment,
                 std::atomic_bool *predictionQueryFlag,
                 torch::Tensor utttStateTensor,
                 torch::Tensor policyLogitsTensor,
                 torch::Tensor stateValueTensor) {
    const std::string nmctsWorkerString = "nmctsWorker[" + std::to_string(workerId) + "]";
    std::cout << (nmctsWorkerString + " | started\n");
    while (true) {
        // worker control logic: wait/sleep, execute task or terminate itself:
        while (workerTaskAssignment->load() == NMCTS_WORKER_WAITING_SIGNAL) {
            // sleep until waiting signal disappears:
            std::this_thread::sleep_for(NMCTS_WORKER_WAITING_FOR_TASK_SLEEP_DURATION);
        }

        if (workerTaskAssignment->load() == NMCTS_WORKER_CLOSING_SIGNAL) {
            // terminate nmctsWorker thread on closing signal:
            std::cout << (nmctsWorkerString + " | return\n");
            return;
        }

        // load assigned task:
        int taskIndex = workerTaskAssignment->load();
        std::string task = tasks[taskIndex];
        // std::string taskString = "task[" + std::to_string(taskIndex) + "]: " + task;
        // std::cout << (nmctsWorkerString + " | received " + taskString + "\n");

        // parse task:
        std::string utttState;
        int numSimulations;
        double explorationStrength;
        uint32_t randomSeed;
        std::string outputPath;
        parseTask(&tasks[taskIndex],
                  &utttState,
                  &numSimulations,
                  &explorationStrength,
                  &randomSeed,
                  &outputPath);
        UltimateTicTacToe *uttt = parseUttt(utttState);

        thread_local std::mt19937 pseudoRandomNumberGenerator(randomSeed);

        // generate evaluations:
        std::string evaluationsString = "";

        NeuralMonteCarloTreeSearchWorker *nmctsw =
            new NeuralMonteCarloTreeSearchWorker(
                uttt->clone(),
                numSimulations,
                explorationStrength,
                workerId,
                predictionQueryFlag,
                utttStateTensor,
                policyLogitsTensor,
                stateValueTensor,
                NMCTS_WORKER_WAITING_FOR_PREDICTION_SLEEP_DURATION,
                &pseudoRandomNumberGenerator);

        while (!uttt->isTerminated()) {
            nmctsw->run();
            // std::cout << (nmctsWorkerString + "\n" + nmctsw->toString() + "\n");

            EvaluatedState *evaluatedState = nmctsw->getEvaluatedState();
            std::string evaluatedStateString = serializeEvaluatedState(evaluatedState);

            EvaluatedAction **evaluatedActions = nmctsw->getEvaluatedActions();
            int numEvaluatedActions = nmctsw->getNumEvaluatedActions();
            std::string evaluatedActionsString =
                serializeEvaluatedActions(evaluatedActions, numEvaluatedActions);

            std::string evaluationString = evaluatedStateString + " " + evaluatedActionsString;
            // std::cout << (nmctsWorkerString + " | " + evaluationString + "\n");
            evaluationsString += evaluationString + "\n";

            Action selectedAction = nmctsw->selectAction(evaluatedActions, numEvaluatedActions, "sample");
            // std::cout << (nmctsWorkerString + " | selected " + selectedAction.toString() + "\n");
            uttt->execute(selectedAction);
            nmctsw->synchronize(uttt);

            for (int i = 0; i < numEvaluatedActions; i++) {
                delete evaluatedActions[i];
            }
            delete[] evaluatedActions;
            delete[] evaluatedState->state;
            delete evaluatedState;
        }
        // std::cout << (nmctsWorkerString + "\n" + nmctsw->toString() + "\n");

        // save evaluations:
        std::ofstream ofs(outputPath);
        ofs << evaluationsString;
        ofs.close();
        std::cout << (nmctsWorkerString + " | evaluations saved to " + outputPath + " successfully!\n");

        // send waiting signal
        workerTaskAssignment->store(NMCTS_WORKER_WAITING_SIGNAL);

        delete nmctsw;
        delete uttt;
    }
}

void predictor(const std::string policyValueNetPath,
               const int numWorkers,
               const int maxBatchSize,
               std::atomic_bool *predictionQueryFlags,
               std::atomic_int *numActiveWorkers,
               std::atomic_bool *predictorClosingSignal,
               torch::Tensor utttStateTensor,
               torch::Tensor policyLogitsTensor,
               torch::Tensor stateValueTensor) {
    torch::jit::script::Module policyValueNet;
    policyValueNet = torch::jit::load(policyValueNetPath);
    policyValueNet.to(torch::kCUDA);
    policyValueNet.eval();
    torch::NoGradGuard noGradGuard;
    int workerShift = 0;
    int *selectedWorkerIds = new int[maxBatchSize];
    torch::Tensor inputBatchTensor = torch::zeros({maxBatchSize, 4, 9, 9}).to(torch::kI8);

    while (true) {
        // check and select workers waiting for inference:
        int numSelectedWorkerIds = 0;
        for (int i = 0, workerId; i < numWorkers; i++) {
            workerId = (i + workerShift) % numWorkers;  // ensures balanced processing
            if (predictionQueryFlags[workerId].load()) {  // worker waits for the predictor
                selectedWorkerIds[numSelectedWorkerIds++] = workerId;  // select workerId
                if (numSelectedWorkerIds == maxBatchSize) break;
            }
        }

        // print selected worker ids:
        // std::string selectedWorkerIdsString =
        //     ("selectedWorkerIds(" + std::to_string(numSelectedWorkerIds) + ") = {");
        // for (int i = 0; i < numSelectedWorkerIds; i++) {
        //     if (i > 0)  selectedWorkerIdsString += ", ";
        //     selectedWorkerIdsString += std::to_string(selectedWorkerIds[i]);
        // }
        // selectedWorkerIdsString += "}";
        // std::cout << ("predictor | " + selectedWorkerIdsString + "\n");

        // predictor control logic: run inference, terminate itself or wait for workers to catch up
        if ((numSelectedWorkerIds > 0) &&
            (numSelectedWorkerIds == maxBatchSize ||
             numSelectedWorkerIds == numActiveWorkers->load())) {
            // run inference because number of selected workers is sufficient:
            // std::cout << ("predictor | inference for " + selectedWorkerIdsString + "\n");

            // create selectedWorkerIdsTensor corresponding to the selectedWorkerIds:
            torch::Tensor selectedWorkerIdsTensor = torch::zeros({numSelectedWorkerIds},
                torch::TensorOptions().dtype(torch::kLong));
            for (int i = 0; i < numSelectedWorkerIds; i++) {
                selectedWorkerIdsTensor.index_put_({i}, selectedWorkerIds[i]);
            }

            // copy worker input from utttStateTensor to inputBatchTensor:
            torch::Tensor inputBatchTensorIndices = torch::arange(numSelectedWorkerIds);
            inputBatchTensor.index_put_({inputBatchTensorIndices},
                utttStateTensor.index_select(0, selectedWorkerIdsTensor));

            // run policyValueNet inference:
            std::vector<torch::jit::IValue> inputs;
            inputs.push_back(inputBatchTensor.to(torch::kCUDA).to(torch::kFloat32));
            auto predictions = policyValueNet.forward(inputs).toTuple();
            torch::Tensor policyLogitsBatchTensor = predictions->elements()[0].toTensor().to(torch::kCPU);
            torch::Tensor stateValueBatchTensor = predictions->elements()[2].toTensor().to(torch::kCPU);

            // copy predictions from policyLogitsBatchTensor to policyLogitsTensor:
            policyLogitsTensor.index_put_({selectedWorkerIdsTensor},
                policyLogitsBatchTensor.index_select(0, inputBatchTensorIndices));

            // copy predictions from stateValueBatchTensor to stateValueTensor:
            stateValueTensor.index_put_({selectedWorkerIdsTensor},
                stateValueBatchTensor.index_select(0, inputBatchTensorIndices));

            // unlock waiting workers:
            for (int i = 0, workerId; i < numSelectedWorkerIds; i++) {
                workerId = selectedWorkerIds[i];
                predictionQueryFlags[workerId].store(false);
            }
            // std::cout << ("predictor | unlocked " + selectedWorkerIdsString + "\n");

            // update worker shift:
            workerShift = (selectedWorkerIds[numSelectedWorkerIds - 1] + 1) % numWorkers;

            continue;

        } else if (predictorClosingSignal->load()) {
            // terminate predictor thread:
            std::cout << ("predictor | return;\n");
            delete[] selectedWorkerIds;
            return;
        }

        // wait for workers to catch up:
        // std::cout << ("predictor | sleeping...\n");
        std::this_thread::sleep_for(PREDICTOR_SLEEP_DURATION);
    }
}

int main(int argc, char *argv[]) {
    if (argc != 5) {
        throw std::runtime_error(
            "required arguments: "
            "policyValueNetPath, taskListPath, numWorkers, maxBatchSize");
    }

    const std::string policyValueNetPath = parseString(argv[1]);
    std::cout << "policyValueNetPath: " << policyValueNetPath << std::endl;

    const std::string taskListPath = parseString(argv[2]);
    std::cout << "taskListPath: " << taskListPath << std::endl;

    const int numWorkers = parseInt(argv[3]);
    std::cout << "numWorkers: " << numWorkers << std::endl;

    const int maxBatchSize = parseInt(argv[4]);
    std::cout << "maxBatchSize: " << maxBatchSize << std::endl;

    // load tasks:
    std::vector<std::string> tasks;
    loadTaskList(&tasks, taskListPath);
    std::cout << "numTasks: " << tasks.size() << std::endl;
    // for (std::size_t taskIndex = 0; taskIndex < tasks.size(); taskIndex++) {
    //     std::cout << "task[" << taskIndex << "]: " << tasks[taskIndex] << std::endl;
    // }

    // create atomic variables used for communication between threads:
    std::atomic_int *workerTaskAssignments = new std::atomic_int[numWorkers];
    for (int workerId = 0; workerId < numWorkers; workerId++) {
        workerTaskAssignments[workerId].store(NMCTS_WORKER_WAITING_SIGNAL);
    }
    std::atomic_int numActiveWorkers(numWorkers);
    std::atomic_bool *predictionQueryFlags = new std::atomic_bool[numWorkers];
    for (int workerId = 0; workerId < numWorkers; workerId++) {
        predictionQueryFlags[workerId].store(false);
    }
    std::atomic_bool predictorClosingSignal(false);

    // create tensors shared between threads:
    torch::Tensor utttStateTensor = torch::empty({numWorkers, 4, 9, 9}).to(torch::kI8);
    torch::Tensor policyLogitsTensor = torch::empty({numWorkers, 9, 9});
    torch::Tensor stateValueTensor = torch::empty({numWorkers});

    // create threads:
    std::thread taskManagerThread(taskManager,
        numWorkers,
        tasks,
        workerTaskAssignments,
        &numActiveWorkers,
        &predictorClosingSignal);
    std::vector<std::thread> nmctsWorkerThreads;
    for (int workerId = 0; workerId < numWorkers; workerId++) {
        std::thread nmctsWorkerThread(nmctsWorker,
            workerId,
            tasks,
            &workerTaskAssignments[workerId],
            &predictionQueryFlags[workerId],
            utttStateTensor.index({workerId}),
            policyLogitsTensor.index({workerId}),
            stateValueTensor.index({workerId}));
        nmctsWorkerThreads.push_back(std::move(nmctsWorkerThread));
    }
    std::thread predictorThread(predictor,
        policyValueNetPath,
        numWorkers,
        maxBatchSize,
        predictionQueryFlags,
        &numActiveWorkers,
        &predictorClosingSignal,
        utttStateTensor,
        policyLogitsTensor,
        stateValueTensor);

    // wait for threads to finish:
    for (std::size_t workerId = 0; workerId < nmctsWorkerThreads.size(); workerId++) {
        nmctsWorkerThreads[workerId].join();
    }
    taskManagerThread.join();
    predictorThread.join();

    delete[] predictionQueryFlags;
    delete[] workerTaskAssignments;

    return 0;
}
