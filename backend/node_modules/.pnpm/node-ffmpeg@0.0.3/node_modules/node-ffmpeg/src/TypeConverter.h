#ifndef NODE_FFMPEG_TYPECONVERTER_H
#define NODE_FFMPEG_TYPECONVERTER_H

#include <nan.h>
#include <libavcodec/codec_id.h>

extern "C" {
#include <libavutil/avutil.h>
}

class TypeConverter {
public:
    static bool GetArgument(v8::Local<v8::Value>,std::string&);
    static bool GetArgument(v8::Local<v8::Value>,uint64_t&);
    static bool GetArgument(v8::Local<v8::Value>,int64_t&);
    static bool GetArgument(v8::Local<v8::Value>,double&);
    static bool GetArgument(v8::Local<v8::Value>,bool&);
    static bool GetArgument(v8::Local<v8::Value>,uint32_t&);
    static bool GetArgument(v8::Local<v8::Value>,int32_t&);
    template<typename T> static bool Unwrap(v8::Local<v8::Value> val, T** out) {
        auto result = val->InstanceOf(Nan::GetCurrentContext(),Nan::To<v8::Object>(Nan::New(T::constructor)).ToLocalChecked());
        if(!result.ToChecked()) {
            return false;
        }
        *out = Nan::ObjectWrap::Unwrap<T>(Nan::To<v8::Object>(val).ToLocalChecked());
        return true;
    }
};

#endif //NODE_FFMPEG_TYPECONVERTER_H
