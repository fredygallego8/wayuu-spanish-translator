#ifndef NODE_FFMPEG_CODECCONTEXT_H
#define NODE_FFMPEG_CODECCONTEXT_H

#include <nan.h>

extern "C" {
#include <libavcodec/avcodec.h>
}

class CodecContext : public Nan::ObjectWrap {
public:
    AVCodecContext* value;
    static Nan::Persistent<v8::Function> constructor;
    static void Init(v8::Local<v8::Object>);
    ~CodecContext();
private:
    static NAN_METHOD(New);
    static NAN_METHOD(Open);
    static NAN_METHOD(ParametersToContext);
    static NAN_METHOD(SampleFormat);
    static NAN_METHOD(TimeBase);
    static NAN_METHOD(FlushBuffers);
    static NAN_METHOD(SendFrame);
    static NAN_METHOD(FrameSize);
    static NAN_METHOD(ReceiveFrame);
    static NAN_METHOD(ReceivePacket);
    static NAN_METHOD(SendPacket);
    CodecContext(AVCodec*);
};


#endif //NODE_FFMPEG_CODECCONTEXT_H
