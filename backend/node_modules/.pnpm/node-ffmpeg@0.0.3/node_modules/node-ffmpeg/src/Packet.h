#ifndef NODE_FFMPEG_PACKET_H
#define NODE_FFMPEG_PACKET_H

#include <nan.h>

extern "C" {
#include <libavcodec/packet.h>
}

class Packet : public Nan::ObjectWrap {
public:
    AVPacket* value;
    static Nan::Persistent<v8::Function> constructor;
    static void Init(v8::Local<v8::Object>);
private:
    Nan::Persistent<v8::ArrayBuffer> data;
    Packet();
    ~Packet();
    static NAN_METHOD(New);
    static NAN_METHOD(Update);
    static NAN_METHOD(Unref);
    static NAN_METHOD(Data);
};


#endif //NODE_FFMPEG_PACKET_H
