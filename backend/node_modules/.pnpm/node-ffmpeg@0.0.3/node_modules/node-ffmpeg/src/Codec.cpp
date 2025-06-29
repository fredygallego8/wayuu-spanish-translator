#include "Codec.h"
#include "TypeConverter.h"
#include "ErrorUtility.h"
#include "Rational.h"

#include <unordered_map>

Nan::Persistent<v8::Function> Codec::constructor;

void Codec::Init(v8::Local<v8::Object> exports) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("Codec").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::Set(
        Nan::GetFunction(tpl).ToLocalChecked(),
        Nan::New("findDecoder").ToLocalChecked(),
        Nan::New<v8::Function>(FindDecoder)
    );
    Nan::Set(
        Nan::GetFunction(tpl).ToLocalChecked(),
        Nan::New("findEncoder").ToLocalChecked(),
        Nan::New<v8::Function>(FindEncoder)
    );

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(
        exports,
        Nan::New("Codec").ToLocalChecked(),
        Nan::GetFunction(tpl).ToLocalChecked()
    );
}

NAN_METHOD(Codec::FindDecoder) {
    auto jsInstance = Nan::NewInstance(
        Nan::New(Codec::constructor),
        0,
        nullptr
    ).ToLocalChecked();
    Codec* codec;
    if(!TypeConverter::Unwrap(jsInstance,&codec)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("findDecoder").c_str());
        return;
    }
    int32_t codecIdInt;
    if(!TypeConverter::GetArgument(info[0],codecIdInt)) {
        Nan::ThrowError("First argument must be a valid codec id");
        return;
    }
    codec->value = avcodec_find_decoder(static_cast<AVCodecID>(codecIdInt));
    if(!codec->value) {
        Nan::ThrowError("Failed to get decoder");
        return;
    }
    UpdateInstanceProps(codec,jsInstance);
    info.GetReturnValue().Set(jsInstance);
}

NAN_METHOD(Codec::FindEncoder) {
    auto jsInstance = Nan::NewInstance(
        Nan::New(Codec::constructor),
        0,
        nullptr
    ).ToLocalChecked();
    Codec* codec;
    if(!TypeConverter::Unwrap(jsInstance,&codec)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("findDecoder").c_str());
        return;
    }
    int32_t codecIdInt;
    if(!TypeConverter::GetArgument(info[0],codecIdInt)) {
        Nan::ThrowError("First argument must be a valid codec id");
        return;
    }
    codec->value = avcodec_find_encoder(static_cast<AVCodecID>(codecIdInt));
    if(!codec->value) {
        Nan::ThrowError("Failed to get decoder");
        return;
    }
    UpdateInstanceProps(codec,jsInstance);
    info.GetReturnValue().Set(jsInstance);
}

static v8::Local<v8::Array> GetSupportedSampleRates(AVCodec* codec) {
    auto supportedSampleRates = Nan::New<v8::Array>();
    auto i = codec->supported_samplerates;
    while(i != nullptr && (*i) != 0) {
        Nan::Set(
            supportedSampleRates,
            Nan::New(supportedSampleRates->Length()),
            Nan::New(*i)
        );
        i++;
    }
    return supportedSampleRates;
}

static v8::Local<v8::Array> GetSupportedFrameRates(AVCodec* codec) {
    auto frameRates = Nan::New<v8::Array>();
    auto i = codec->supported_framerates;
    while(i != nullptr && (i->num != 0 || i->den != 0)) {
        v8::Local<v8::Value> argv[] = {
            Nan::New(i->num),
            Nan::New(i->den)
        };
        auto rat = Nan::NewInstance(Nan::New(Rational::constructor),2,argv).ToLocalChecked();
        Nan::Set(
            frameRates,
            Nan::New(frameRates->Length()),
            rat
        );
        i++;
    }
    return frameRates;
}

static v8::Local<v8::Array> GetSupportedSampleFormats(AVCodec* codec) {
    auto frameRates = Nan::New<v8::Array>();
    auto i = codec->sample_fmts;
    while(i != nullptr && (*i) != -1) {
        Nan::Set(
            frameRates,
            Nan::New(frameRates->Length()),
            Nan::New(*i)
        );
        i++;
    }
    return frameRates;
}

static v8::Local<v8::Array> GetSupportedPixelFormats(AVCodec* codec) {
    auto frameRates = Nan::New<v8::Array>();
    auto i = codec->pix_fmts;
    while(i != nullptr && (*i) != -1) {
        Nan::Set(
            frameRates,
            Nan::New(frameRates->Length()),
            Nan::New(*i)
        );
        i++;
    }
    return frameRates;
}

static v8::Local<v8::Array> GetSupportedChannelLayouts(AVCodec* codec) {
    auto layouts = Nan::New<v8::Array>();
    auto i = codec->channel_layouts;
    while(i != nullptr && (*i) != 0) {
        Nan::Set(
            layouts,
            Nan::New(layouts->Length()),
            Nan::New<v8::Number>(*i)
        );
        i++;
    }
    return layouts;
}

void Codec::UpdateInstanceProps(Codec* codec, v8::Local<v8::Object> jsInstance) {
    std::unordered_map<std::string,v8::Local<v8::Value>> otherProps {
        {"supportedSampleRates", GetSupportedSampleRates(codec->value)},
        {"supportedFrameRates",GetSupportedFrameRates(codec->value)},
        {"supportedSampleFormats",GetSupportedSampleFormats(codec->value)},
        {"supportedChannelLayouts",GetSupportedChannelLayouts(codec->value)},
        {"supportedPixelFormats",GetSupportedPixelFormats(codec->value)}
    };
    std::unordered_map<std::string, int> intProps {
        {"capabilities",codec->value->capabilities}
    };
    std::unordered_map<std::string, const char*> stringProps {
        {"name",codec->value->name}
    };
    for(auto& p : otherProps) {
        Nan::Set(jsInstance,Nan::New(p.first).ToLocalChecked(),p.second);
    }
    for(auto& p : intProps) {
        Nan::Set(
            jsInstance,
            Nan::New(p.first).ToLocalChecked(),
            Nan::New(p.second)
        );
    }
    for(auto& p : stringProps) {
        Nan::Set(
            jsInstance,
            Nan::New(p.first).ToLocalChecked(),
            Nan::New(p.second).ToLocalChecked()
        );
    }
}

NAN_METHOD(Codec::New) {
    auto* codec = new Codec();
    codec->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

Codec::Codec(): value(nullptr) {

}
