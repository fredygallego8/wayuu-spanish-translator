#include "FormatContext.h"
#include "Packet.h"
#include "Codec.h"
#include "CodecContext.h"
#include "Frame.h"
#include "TypeConverter.h"
#include "Constants.h"
#include "CodecParameters.h"
#include "Stream.h"
#include "Rational.h"

#include <nan.h>

NAN_METHOD(GetBytesPerSample) {
    int32_t sampleFmtInt;
    if(!TypeConverter::GetArgument(info[0],sampleFmtInt)) {
        Nan::ThrowError("First argument must be a valid signed 32-bit integer");
        return;
    }
    info.GetReturnValue().Set(
        Nan::New(av_get_bytes_per_sample(static_cast<AVSampleFormat>(sampleFmtInt)))
    );
}

NAN_MODULE_INIT(Init) {
    auto constants = Nan::New<v8::Object>();
    Constants::Init(constants);
    Nan::Set(target,Nan::New("constants").ToLocalChecked(),constants);

    FormatContext::Init(target);
    Packet::Init(target);
    Codec::Init(target);
    CodecContext::Init(target);
    Frame::Init(target);
    Stream::Init(target);
    Rational::Init(target);
    CodecParameters::Init(target);
    Nan::Set(
        target,
        Nan::New("getBytesPerSample").ToLocalChecked(),
        Nan::New<v8::Function>(GetBytesPerSample)
    );
}

NODE_MODULE(ffmpeg, Init)
