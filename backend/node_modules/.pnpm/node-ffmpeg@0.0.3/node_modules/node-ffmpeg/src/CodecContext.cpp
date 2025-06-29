#include "CodecContext.h"
#include "Codec.h"
#include "TypeConverter.h"
#include "ErrorUtility.h"
#include "Packet.h"
#include "Frame.h"
#include "CodecParameters.h"
#include "Rational.h"

Nan::Persistent<v8::Function> CodecContext::constructor;

void CodecContext::Init(v8::Local<v8::Object> exports) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("CodecContext").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(tpl,"open",Open);
    Nan::SetPrototypeMethod(tpl,"sendPacket",SendPacket);
    Nan::SetPrototypeMethod(tpl,"flushBuffers",FlushBuffers);
    Nan::SetPrototypeMethod(tpl,"sendFrame",SendFrame);
    Nan::SetPrototypeMethod(tpl,"receivePacket",ReceivePacket);
    Nan::SetPrototypeMethod(tpl,"timeBase",TimeBase);
    Nan::SetPrototypeMethod(tpl,"frameSize",FrameSize);
    Nan::SetPrototypeMethod(tpl,"parametersToContext",ParametersToContext);
    Nan::SetPrototypeMethod(tpl,"sampleFormat",SampleFormat);
    Nan::SetPrototypeMethod(tpl,"receiveFrame",ReceiveFrame);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(
        exports,
        Nan::New("CodecContext").ToLocalChecked(),
        Nan::GetFunction(tpl).ToLocalChecked()
    );
}

NAN_METHOD(CodecContext::TimeBase) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("timeBase()").c_str());
        return;
    }
    Rational* rational;
    if(!TypeConverter::Unwrap(info[0],&rational)) {
        Nan::ThrowError("First argument must be a valid Rational instance");
        return;
    }
    std::memcpy(&ctx->value->time_base, &rational->value, sizeof(AVRational));
}

NAN_METHOD(CodecContext::FrameSize) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("sendFrame()").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(ctx->value->frame_size));
}

NAN_METHOD(CodecContext::SendFrame) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("sendFrame()").c_str());
        return;
    }
    Frame* frame;
    if(!TypeConverter::Unwrap(info[0],&frame)) {
        Nan::ThrowError("First argument must be a valid Frame instance");
        return;
    }
    info.GetReturnValue().Set(Nan::New(avcodec_send_frame(ctx->value,frame->value)));
}

NAN_METHOD(CodecContext::ReceiveFrame) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("receiveFrame()").c_str());
        return;
    }
    Frame* frame;
    if(!TypeConverter::Unwrap(info[0],&frame)) {
        Nan::ThrowError("First argument must be a valid Packet instance");
        return;
    }
    int status = avcodec_receive_frame(ctx->value, frame->value);
    info.GetReturnValue().Set(Nan::New(status));
}

NAN_METHOD(CodecContext::ReceivePacket) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("receivePacket()").c_str());
        return;
    }
    Packet* packet;
    if(!TypeConverter::Unwrap(info[0],&packet)) {
        Nan::ThrowError("First argument must be a valid Packet instance");
        return;
    }
    int status = avcodec_receive_packet(ctx->value, packet->value);
    info.GetReturnValue().Set(Nan::New(status));
}

NAN_METHOD(CodecContext::SampleFormat) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("sampleFormat()").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(ctx->value->sample_fmt));
}

NAN_METHOD(CodecContext::ParametersToContext) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("parametersToContext()").c_str());
        return;
    }
    CodecParameters* params;
    if(!TypeConverter::Unwrap(info[0],&params)){
        Nan::ThrowError("Failed to create CodecParameters instance");
        return;
    }
    int status = avcodec_parameters_to_context(ctx->value,params->getValue());
    if(status != 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(CodecContext::SendPacket) {
    Packet* packet;
    if(!TypeConverter::Unwrap(info[0],&packet)) {
        Nan::ThrowError("First argument must be a valid Packet instance");
        return;
    }
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("sendPacket()").c_str());
        return;
    }
    int status = avcodec_send_packet(ctx->value, packet->value);
    info.GetReturnValue().Set(Nan::New(status));
}

NAN_METHOD(CodecContext::New) {
    Codec* codec;
    if(!TypeConverter::Unwrap(info[0],&codec)) {
        Nan::ThrowError("First argument must be a valid codec instance");
        return;
    }
    auto* ctx = new CodecContext(codec->value);
    ctx->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CodecContext::Open) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("open()").c_str());
        return;
    }
    Codec* codec;
    if(!TypeConverter::Unwrap(info[0],&codec)) {
        Nan::ThrowError("First argument must be a valid Codec instance");
        return;
    }
    int status = avcodec_open2(ctx->value, codec->value, nullptr);
    if(status != 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(CodecContext::FlushBuffers) {
    CodecContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("open()").c_str());
        return;
    }
    avcodec_flush_buffers(ctx->value);
}

CodecContext::CodecContext(AVCodec* codec): value(avcodec_alloc_context3(codec)) {

}

CodecContext::~CodecContext() {
    avcodec_close(value);
    avcodec_free_context(&value);
}
