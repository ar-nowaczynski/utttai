cmake_minimum_required(VERSION 3.0 FATAL_ERROR)
project(utttcpp)

add_compile_options(-O2 -pedantic-errors -Wall -Wextra -Werror)

find_package(Torch REQUIRED)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${TORCH_CXX_FLAGS}")

include_directories(include)

add_executable(nmcts-evaluate
  src/nmcts-evaluate.cpp
  src/utttcpp/game/action.cpp
  src/utttcpp/game/ultimateTicTacToe.cpp
  src/utttcpp/helpers/doubleToString.cpp
  src/utttcpp/helpers/prngMersenneTwister.cpp
  src/utttcpp/selfplay/neuralMonteCarloTreeSearch.cpp
)
target_link_libraries(nmcts-evaluate "${TORCH_LIBRARIES}")
set_property(TARGET nmcts-evaluate PROPERTY CXX_STANDARD 14)

add_executable(nmcts-generate
  src/nmcts-generate.cpp
  src/utttcpp/game/action.cpp
  src/utttcpp/game/ultimateTicTacToe.cpp
  src/utttcpp/helpers/doubleToString.cpp
  src/utttcpp/selfplay/neuralMonteCarloTreeSearchWorker.cpp
)
target_compile_options(nmcts-generate PRIVATE -pthread)
target_link_libraries(nmcts-generate "${TORCH_LIBRARIES}")
set_property(TARGET nmcts-generate PROPERTY CXX_STANDARD 14)
