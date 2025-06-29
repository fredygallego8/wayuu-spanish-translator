#ifndef NODE_FFMPEG_FORMATCONTEXT_H
#define NODE_FFMPEG_FORMATCONTEXT_H

#include <nan.h>

extern "C" {
#include <libavformat/avformat.h>
}

class FormatContext : public Nan::ObjectWrap {
public:
    AVFormatContext* value;
    FormatContext();
    ~FormatContext();
    static void Init(v8::Local<v8::Object>);
    static Nan::Persistent<v8::Function> constructor;
private:
    enum class AllocationType {
        None,
        OpenInput,
        AllocOutputContext
    } allocationType;
    std::string filename;
    static NAN_METHOD(OpenInput);
    static NAN_METHOD(ReadFrame);
    static NAN_METHOD(WriteTrailer);
    static NAN_METHOD(AllocOutputContext);
    static NAN_METHOD(NewStream);
    static NAN_METHOD(WriteFrame);
    static NAN_METHOD(WriteHeader);
    static NAN_METHOD(DumpFormat);
    static NAN_METHOD(New);
    static NAN_METHOD(Open);
    static NAN_METHOD(Close);
    static NAN_METHOD(Streams);
    static NAN_METHOD(FindStreamInfo);
    static NAN_METHOD(FindBestStream);
    Nan::Persistent<v8::Array> streams;
};

#endif //NODE_FFMPEG_FORMATCONTEXT_H
