#include "CodecParameters.h"
#include "TypeConverter.h"
#include "ErrorUtility.h"
#include "CodecContext.h"

#include <unordered_map>
#include <stdexcept>

Nan::Persistent<v8::Function> CodecParameters::constructor;

void CodecParameters::Init(v8::Local<v8::Object> exports) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("CodecParameters").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(tpl,"codecId",CodecId);
    Nan::SetPrototypeMethod(tpl,"frameSize",FrameSize);
    Nan::SetPrototypeMethod(tpl, "fromContext", FromContext);
    Nan::SetPrototypeMethod(tpl,"sampleRate",SampleRate);
    Nan::SetPrototypeMethod(tpl,"sampleRate",SampleRate);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(
        exports,
        Nan::New("CodecParameters").ToLocalChecked(),
        Nan::GetFunction(tpl).ToLocalChecked()
    );
}

NAN_METHOD(CodecParameters::FromContext) {
    CodecParameters* params;
    if(!TypeConverter::Unwrap(info.This(),&params)){
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("fromContext").c_str());
        return;
    }
    CodecContext* src;
    if(!TypeConverter::Unwrap(info[0],&src)){
        Nan::ThrowError("First argument must be a valid CodecContext instance");
        return;
    }
    int status = avcodec_parameters_from_context(params->value,src->value);
    if(status < 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(CodecParameters::Copy) {
    CodecParameters* dst;
    if(!TypeConverter::Unwrap(info.This(),&dst)){
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("copy").c_str());
        return;
    }
    CodecParameters* src;
    if(!TypeConverter::Unwrap(info[0],&src)){
        Nan::ThrowError("First argument must be a valid CodecParameters instance");
        return;
    }
    int status = avcodec_parameters_copy(dst->value,src->value);
    if(status < 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(CodecParameters::New) {
    AVCodecParameters* params = avcodec_parameters_alloc();
    memset(params,0,sizeof(AVCodecParameters));
    if(info[0]->IsObject() && !info[0]->IsNull()) {
        int codecType,codecId;
        auto inputParams = Nan::To<v8::Object>(info[0]).ToLocalChecked();
        std::unordered_map<std::string, int&> intOptionalParams {
            {"width",params->width},
            {"height",params->height},
            {"sampleRate",params->sample_rate},
            {"channels",params->channels},
            {"frameSize",params->frame_size}
        };
        std::unordered_map<std::string, uint64_t&> ulongOptionalParams {
            {"channelLayout",params->channel_layout}
        };
        std::unordered_map<std::string, int64_t&> slongOptionalParams {
            {"bitRate",params->bit_rate}
        };
        std::unordered_map<std::string, int&> intRequiredParams {
            {"format",params->format},
            {"codecType",codecType},
            {"codecId",codecId}
        };
        for(auto& p : intOptionalParams) {
            auto given = Nan::Get(inputParams,Nan::New(p.first).ToLocalChecked()).ToLocalChecked();
            if(!TypeConverter::GetArgument(given,p.second)) {
                p.second = 0;
                continue;
            }
        }
        for(auto& p : ulongOptionalParams) {
            auto given = Nan::Get(inputParams,Nan::New(p.first).ToLocalChecked()).ToLocalChecked();
            if(!TypeConverter::GetArgument(given,p.second)) {
                p.second = 0;
                continue;
            }
        }
        for(auto& p : slongOptionalParams) {
            auto given = Nan::Get(inputParams,Nan::New(p.first).ToLocalChecked()).ToLocalChecked();
            if(!TypeConverter::GetArgument(given,p.second)) {
                p.second = 0;
                continue;
            }
        }
        for(auto& p : intRequiredParams) {
            auto given = Nan::Get(inputParams,Nan::New(p.first).ToLocalChecked()).ToLocalChecked();
            if(!TypeConverter::GetArgument(given,p.second)){
                Nan::ThrowError(("Missing property " + p.first + " in first argument").c_str());
                return;
            }
        }
        params->codec_id = AVCodecID(codecId);
        params->codec_type = AVMediaType(codecType);
    }
    auto* obj = new CodecParameters(params,CodecParametersCreationMode::Internalized);
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CodecParameters::CodecId) {
    CodecParameters* c;
    if(!TypeConverter::Unwrap(info.This(),&c)){
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("codecId()").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(c->value->codec_id));
}

NAN_METHOD(CodecParameters::FrameSize) {
    CodecParameters* c;
    if(!TypeConverter::Unwrap(info.This(),&c)){
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("frameSize()").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(c->value->frame_size));
}

NAN_METHOD(CodecParameters::SampleRate) {
    CodecParameters* c;
    if(!TypeConverter::Unwrap(info.This(),&c)){
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("sampleRate()").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(c->value->sample_rate));
}

CodecParameters::~CodecParameters() {
    free();
}

AVCodecParameters *CodecParameters::getValue() const {
    return value;
}

int CodecParameters::copy(AVCodecParameters* newParams) {
    return avcodec_parameters_copy(value,newParams);
}

CodecParameters::CodecParameters(AVCodecParameters *value, CodecParametersCreationMode creationMode):
    value(value),
    creationMode(creationMode)
{

}

void CodecParameters::free() {
    switch(creationMode) {
        case CodecParametersCreationMode::None:
            break;
        case CodecParametersCreationMode::Externalized:
            value = nullptr;
            break;
        case CodecParametersCreationMode::Internalized:
            avcodec_parameters_free(&value);
    }
    creationMode = CodecParametersCreationMode::None;
}

bool CodecParameters::update(AVCodecParameters *newValue, CodecParametersCreationMode newCreationMode) {
    /**
     * Make sure to free existing codec parameters object
     */
    free();
    int status;
    switch(newCreationMode){
        case CodecParametersCreationMode::None:
            value = nullptr;
            break;
        case CodecParametersCreationMode::Externalized:
            value = newValue;
            break;
        case CodecParametersCreationMode::Internalized:
            value = avcodec_parameters_alloc();
            if(!value) {
                return false;
            }
            status = avcodec_parameters_copy(value,newValue);
            if(status < 0) {
                fprintf(stderr,"%s",ErrorUtility::GetAVError(status).c_str());
                return false;
            }
            break;
    }
    creationMode = newCreationMode;
    return true;
}

CodecParameters::CodecParameters():
    creationMode(CodecParametersCreationMode::None),
    value(nullptr)
{}
