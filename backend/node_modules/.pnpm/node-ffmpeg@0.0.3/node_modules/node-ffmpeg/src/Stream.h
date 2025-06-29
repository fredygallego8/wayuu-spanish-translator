#ifndef NODE_FFMPEG_STREAM_H
#define NODE_FFMPEG_STREAM_H

#include <nan.h>

extern "C" {
#include <libavformat/avformat.h>
}

class Stream : public Nan::ObjectWrap {
public:
    static Nan::Persistent<v8::Function> constructor;
    static void Init(v8::Local<v8::Object>);
    bool setStream(AVStream*);
private:
    AVStream* value;
    Stream();
    ~Stream();
    Nan::Persistent<v8::Object> codecParameters;
    static NAN_METHOD(New);
    static NAN_METHOD(TimeBase);
    static NAN_METHOD(Id);
};


#endif //NODE_FFMPEG_STREAM_H
