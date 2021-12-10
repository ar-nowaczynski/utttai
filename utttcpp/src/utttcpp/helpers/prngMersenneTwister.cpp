#include "utttcpp/helpers/prngMersenneTwister.hpp"

namespace utttcpp {

__uint32_t MT[624];
__int32_t mti = 0;

void InitializeMersenneTwisterPRNG(__uint32_t x0) {
    __uint64_t x;
    MT[0] = x0;
    for (int i = 1; i < 623; i++) {
        x = MT[i - 1];
        x = (23023 * x) & 0xffffffffull;
        x = (3 * x) & 0xffffffffull;
        MT[i] = x;
    }
}

__uint32_t MersenneTwisterPRNG() {
    const __uint32_t MA[] = {0, 0x9908b0df};
    __uint32_t y;
    __int32_t i1, i397;
    i1 = mti + 1;
    if (i1 > 623) {
        i1 = 0;
    }
    i397 = mti + 397;
    if (i397 > 623) {
        i397 -= 624;
    }
    y = (MT[mti] & 0x80000000) | (MT[i1] & 0x7fffffff);
    MT[mti] = MT[i397] ^ (y >> 1) ^ MA[y & 1];
    y = MT[mti];
    y ^= y >> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >> 18;
    mti = i1;
    return y;
}

int randInt(int a, int b) {
    if (a > b) return 0;
    return a + MersenneTwisterPRNG() % ((unsigned int)b - a + 1);
}

double randDouble(double a, double b) {
    if (a > b) return 0.0;
    return static_cast<double>(MersenneTwisterPRNG()) / 0xffffffffU * (b - a) + a;
}

}  // namespace utttcpp
