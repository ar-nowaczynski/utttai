#include "utttcpp/helpers/getTimestamp.hpp"

#include <chrono>

namespace utttcpp {

uint64_t getTimestamp() {
    using std::chrono::duration_cast;
    using std::chrono::microseconds;
    using std::chrono::system_clock;
    uint64_t ts = duration_cast<microseconds>(system_clock::now().time_since_epoch()).count();
    return ts;
}

}  // namespace utttcpp
