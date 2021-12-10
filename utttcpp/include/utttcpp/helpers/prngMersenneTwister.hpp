#ifndef UTTTCPP_HELPERS_PRNGMERSENNETWISTER_HPP_
#define UTTTCPP_HELPERS_PRNGMERSENNETWISTER_HPP_

#include <cstdint>

namespace utttcpp {

void InitializeMersenneTwisterPRNG(__uint32_t x0);
int randInt(int a, int b);  // [a, a + 1, ... , b - 1, b]
double randDouble(double a, double b);  // [a, b]

}  // namespace utttcpp

#endif  // UTTTCPP_HELPERS_PRNGMERSENNETWISTER_HPP_
