#include "utttcpp/helpers/doubleToString.hpp"

namespace utttcpp {

std::string doubleToString(const double number, const int precision) {
    std::string outstr(16, '\0');
    std::string format = "%." + std::to_string(precision) + "f";
    int size = std::snprintf(&outstr[0], outstr.size(), format.c_str(), number);
    outstr.resize(size);
    return outstr;
}

}  // namespace utttcpp
