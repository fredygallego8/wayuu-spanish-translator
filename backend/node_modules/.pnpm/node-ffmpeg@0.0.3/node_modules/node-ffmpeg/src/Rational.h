#ifndef NODE_FFMPEG_RATIONAL_H
#define NODE_FFMPEG_RATIONAL_H

#include <nan.h>
extern "C" {
#include <libavutil/rational.h>
}

class Rational : public Nan::ObjectWrap {
public:
    static Nan::Persistent<v8::Function> constructor;
    AVRational value;
    static void Init(v8::Local<v8::Object>);
private:
    static NAN_METHOD(New);
    Rational(int,int);
};


#endif //NODE_FFMPEG_RATIONAL_H
