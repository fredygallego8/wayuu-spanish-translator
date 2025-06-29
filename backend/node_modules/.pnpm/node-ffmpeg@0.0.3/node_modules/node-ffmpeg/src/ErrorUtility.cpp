#include "ErrorUtility.h"

#include <cstring>
extern "C" {
#include <libavutil/error.h>
}

std::string ErrorUtility::ThrowInvalidThis(std::string &&methodName) {
    return std::move(methodName) + "() called under invalid context";
}

std::string ErrorUtility::GetAVError(int errn) {
    char err[1000];
    if(av_strerror(errn,err,1000) != 0) {
        return "av_strerror returned an error";
    }
    return { err, strlen(err) };
}
