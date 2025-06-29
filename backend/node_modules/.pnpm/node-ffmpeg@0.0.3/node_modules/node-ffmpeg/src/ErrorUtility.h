#ifndef NODE_FFMPEG_ERRORUTILITY_H
#define NODE_FFMPEG_ERRORUTILITY_H


#include <string>

class ErrorUtility {
public:
    static std::string GetAVError(int errn);
    static std::string ThrowInvalidThis(std::string&& methodName);
};


#endif //NODE_FFMPEG_ERRORUTILITY_H
