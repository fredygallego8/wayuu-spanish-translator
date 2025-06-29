#ifndef NODE_FFMPEG_CODEC_H
#define NODE_FFMPEG_CODEC_H

#include <nan.h>

extern "C" {
#include <libavcodec/avcodec.h>
}

class Codec : public Nan::ObjectWrap {
public:
    AVCodec* value;
    static void Init(v8::Local<v8::Object>);
    static Nan::Persistent<v8::Function> constructor;
private:
    static NAN_METHOD(New);
    static NAN_METHOD(FindDecoder);
    static NAN_METHOD(FindEncoder);
    static void UpdateInstanceProps(Codec* codec, v8::Local<v8::Object> jsInstance);
    Codec();
};


#endif //NODE_FFMPEG_CODEC_H
