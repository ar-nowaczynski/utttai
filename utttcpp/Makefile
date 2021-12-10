CXX      := -g++
CXXFLAGS := -std=c++11 -O2 -pedantic-errors -Wall -Wextra -Werror
INCLUDE  := -Iinclude/
SOURCE   :=                                \
   $(wildcard src/utttcpp/game/*.cpp)      \
   $(wildcard src/utttcpp/helpers/*.cpp)   \
   src/utttcpp/selfplay/monteCarloTreeSearch.cpp

SOURCE_DEVELOP  := $(SOURCE) src/mcts-develop.cpp
TARGET_DEVELOP  := mcts-build/mcts-develop
SOURCE_EVALUATE := $(SOURCE) src/mcts-evaluate.cpp
TARGET_EVALUATE := mcts-build/mcts-evaluate
SOURCE_GENERATE := $(SOURCE) src/mcts-generate.cpp
TARGET_GENERATE := mcts-build/mcts-generate

.PHONY: mcts-develop
mcts-develop:
	$(CXX) $(SOURCE_DEVELOP) -o $(TARGET_DEVELOP) $(INCLUDE) $(CXXFLAGS)

.PHONY: mcts-evaluate
mcts-evaluate:
	$(CXX) $(SOURCE_EVALUATE) -o $(TARGET_EVALUATE) $(INCLUDE) $(CXXFLAGS)

.PHONY: mcts-generate
mcts-generate:
	$(CXX) $(SOURCE_GENERATE) -o $(TARGET_GENERATE) $(INCLUDE) $(CXXFLAGS)
