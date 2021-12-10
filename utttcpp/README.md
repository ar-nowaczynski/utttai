# utttcpp

This folder contains the C++ implementation of Ultimate Tic-Tac-Toe, Monte-Carlo Tree Search (MCTS) and Neural Monte-Carlo Tree Search (NMCTS) used to create training datasets: `stage1-mcts` and `stage2-nmcts`.

## Monte-Carlo Tree Search (MCTS)

Create executables from [src/mcts-evaluate.cpp](src/mcts-evaluate.cpp) and [src/mcts-generate.cpp](src/mcts-generate.cpp) source files with:

```bash
mkdir mcts-build
make mcts-evaluate mcts-generate
```

Run executable files:

```bash
cd mcts-build/
./mcts-evaluate 000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000190 1000000 2.0 574513928 output_mcts_evaluate.txt
./mcts-generate 000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000190 100000 2.0 219384005 output_mcts_generate.txt
```

## Neural Monte-Carlo Tree Search (NMCTS)

Download LibTorch 1.8.2 for CUDA 11.1 (https://download.pytorch.org/libtorch/lts/1.8/cu111/libtorch-cxx11-abi-shared-with-deps-1.8.2%2Bcu111.zip) and unpack.

Create executables from [src/nmcts-evaluate.cpp](src/nmcts-evaluate.cpp) and [src/nmcts-generate.cpp](src/nmcts-generate.cpp) source file with:

```bash
mkdir nmcts-build
cd nmcts-build/
cmake -DCMAKE_PREFIX_PATH=/absolute/path/to/libtorch ..
cmake --build . --config Release
```

Run executable files:

```bash
./nmcts-evaluate /path/to/policy_value_net_traced.pt 000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000190 10000 2.0 319571942 output_nmcts_evaluate.txt
./nmcts-generate /path/to/policy_value_net_traced.pt /path/to/taskList.txt numWorkers maxBatchSize
```

- `policy_value_net_traced.pt` - is created using [trace_policy_value_net_module.py](../scripts/trace_policy_value_net_module.py) script

- `taskList.txt` - text file containing list of arguments, for example:

```txt
000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000190 1000 2.0 784395089 output_nmcts_generate/001.txt
000000010000000001000000020000000000201000000000000000000000000000010000000020000000000000270 1000 2.0 214982251 output_nmcts_generate/002.txt
000000000010120020010000000000201000000001000000000200020000101000000001022000000000000000250 1000 2.0 879590441 output_nmcts_generate/003.txt
000000000000001010000000000020000000000000000020000000000000000000120000000000000000000000140 1000 2.0 411591161 output_nmcts_generate/004.txt
000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000260 1000 2.0 835947268 output_nmcts_generate/005.txt
```

- `numWorkers` and `maxBatchSize` - set based on available CPU and GPU power, usually `numWorkers` > `maxBatchSize`, for example: `128` and `64` respectively
