#include "Frame.h"
#include "TypeConverter.h"
#include "ErrorUtility.h"

#include <unordered_map>

Nan::Persistent<v8::Function> Frame::constructor;

void Frame::Init(v8::Local<v8::Object> exports) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("Frame").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(tpl,"getBuffer",GetBuffer);
    Nan::SetPrototypeMethod(tpl,"makeWritable",MakeWritable);
    Nan::SetPrototypeMethod(tpl,"sampleRate",SampleRate);
    Nan::SetPrototypeMethod(tpl,"samples",Samples);
    Nan::SetPrototypeMethod(tpl,"update",Update);
    Nan::SetPrototypeMethod(tpl,"data",Data);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(exports,Nan::New("Frame").ToLocalChecked(),Nan::GetFunction(tpl).ToLocalChecked());
}

NAN_METHOD(Frame::MakeWritable) {
    Frame* frame;
    if(!TypeConverter::Unwrap(info.This(),&frame)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("makeWritable()").c_str());
        return;
    }
    int status = av_frame_make_writable(frame->value);
    if(status != 0) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("makeWritable()").c_str());
        return;
    }
}

NAN_METHOD(Frame::SampleRate) {
    Frame* frame;
    if(!TypeConverter::Unwrap(info.This(),&frame)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("sampleRate").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(frame->value->sample_rate));
}

NAN_METHOD(Frame::Samples) {
    Frame* frame;
    if(!TypeConverter::Unwrap(info.This(),&frame)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("samples()").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(frame->value->nb_samples));
}

static void UpdateAVFrameFromJavaScriptObject(v8::Local<v8::Value> arg, AVFrame* data){
    v8::Local<v8::String> key;
    v8::Local<v8::Value> value;
    v8::Local<v8::Object> inputProps;
    if(!arg->IsObject()) {
        return;
    }
    inputProps = Nan::To<v8::Object>(arg).ToLocalChecked();
    std::unordered_map<std::string,int&> optionalIntProps {
        {"width",data->width},
        {"height",data->height},
        {"format",data->format},
        {"sampleRate",data->sample_rate},
        {"samples",data->nb_samples},
    };
    std::unordered_map<std::string,unsigned long&> optionalUnsignedLongProps {
        {"channelLayout",data->channel_layout}
    };
    std::unordered_map<std::string,long&> optionalLongProps {
        {"pts",data->pts}
    };
    for(auto& p : optionalLongProps) {
        value = Nan::Get(inputProps,Nan::New(p.first).ToLocalChecked()).ToLocalChecked();
        if(!TypeConverter::GetArgument(value,p.second)){
            continue;
        }
    }
    for(auto& i : optionalIntProps) {
        key = Nan::New(i.first).ToLocalChecked();
        value = Nan::Get(inputProps,key).ToLocalChecked();
        if(!TypeConverter::GetArgument(value,i.second)) {
            continue;
        }
    }
    for(auto& i : optionalUnsignedLongProps) {
        key = Nan::New(i.first).ToLocalChecked();
        value = Nan::Get(inputProps,key).ToLocalChecked();
        if(!TypeConverter::GetArgument(value,i.second)) {
            continue;
        }
    }
}

NAN_METHOD(Frame::Update) {
    Frame* frame;
    if(!TypeConverter::Unwrap(info.This(),&frame)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("update").c_str());
        return;
    }
    UpdateAVFrameFromJavaScriptObject(info[0], frame->value);
}

NAN_METHOD(Frame::New) {
    AVFrame* data = av_frame_alloc();
    UpdateAVFrameFromJavaScriptObject(info[0], data);
    auto frame = new Frame(data);
    frame->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Frame::GetBuffer) {
    Frame* frame;
    if(!TypeConverter::Unwrap(info.This(),&frame)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("getBuffer()").c_str());
        return;
    }
    int align;
    if(!TypeConverter::GetArgument(info[0],align)) {
        align = 0;
    }
    int status = av_frame_get_buffer(frame->value,align);
    if(status != 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(Frame::Data) {
    Frame* frame;
    if(!TypeConverter::Unwrap(info.This(),&frame)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("data()").c_str());
        return;
    }
    uint8_t* buf;
    uint32_t i;
    size_t size;
    if(!TypeConverter::GetArgument(info[0],i)) {
        Nan::ThrowError("First argument must be a valid 32-bit integer");
        return;
    }
    if(!TypeConverter::GetArgument(info[1],size)) {
        Nan::ThrowError("Second argument must be a valid 32-bit integer");
        return;
    }
    buf = frame->value->data[i];
    auto result = v8::ArrayBuffer::New(
        Nan::GetCurrentContext()->GetIsolate(),
        buf,
        size,
        v8::ArrayBufferCreationMode::kExternalized
    );
    info.GetReturnValue().Set(result);
}

Frame::Frame(AVFrame* value): value(value) {

}

Frame::~Frame() {
    av_frame_free(&value);
}
