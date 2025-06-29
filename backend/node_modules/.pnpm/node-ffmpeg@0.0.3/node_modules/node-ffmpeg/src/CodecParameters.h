#ifndef NODE_FFMPEG_CODECPARAMETERS_H
#define NODE_FFMPEG_CODECPARAMETERS_H

#include <nan.h>
extern "C" {
#include <libavcodec/avcodec.h>
}

enum class CodecParametersCreationMode {
    None,
    Internalized,
    Externalized
};

class CodecParameters : public Nan::ObjectWrap {
public:
    explicit CodecParameters();
    explicit CodecParameters(AVCodecParameters* value, CodecParametersCreationMode creationMode);
    ~CodecParameters();
    static Nan::Persistent<v8::Function> constructor;
    static void Init(v8::Local<v8::Object>);
    AVCodecParameters* getValue() const;
    bool update(AVCodecParameters* value, CodecParametersCreationMode creationMode);
    int copy(AVCodecParameters *newParams);
private:
    CodecParametersCreationMode creationMode;
    AVCodecParameters* value;
    void free();
    static NAN_METHOD(New);
    static NAN_METHOD(FrameSize);
    static NAN_METHOD(FromContext);
    static NAN_METHOD(Copy);
    static NAN_METHOD(SampleRate);
    static NAN_METHOD(CodecId);
};


#endif //NODE_FFMPEG_CODECPARAMETERS_H
