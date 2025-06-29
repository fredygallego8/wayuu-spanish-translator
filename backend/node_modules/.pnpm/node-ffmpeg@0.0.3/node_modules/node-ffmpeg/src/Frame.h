#ifndef NODE_FFMPEG_FRAME_H
#define NODE_FFMPEG_FRAME_H

#include <nan.h>
extern "C" {
#include <libavutil/frame.h>
}

class Frame : public Nan::ObjectWrap {
public:
    AVFrame* value;
    static void Init(v8::Local<v8::Object>);
    static Nan::Persistent<v8::Function> constructor;
private:
    static NAN_METHOD(New);
    static NAN_METHOD(Data);
    static NAN_METHOD(GetBuffer);
    static NAN_METHOD(SampleRate);
    static NAN_METHOD(Update);
    static NAN_METHOD(MakeWritable);
    static NAN_METHOD(Samples);
    explicit Frame(AVFrame*);
    ~Frame();
};


#endif //NODE_FFMPEG_FRAME_H
