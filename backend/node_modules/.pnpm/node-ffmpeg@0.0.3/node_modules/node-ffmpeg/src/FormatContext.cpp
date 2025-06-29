#include "FormatContext.h"
#include "TypeConverter.h"
#include "ErrorUtility.h"
#include "Packet.h"
#include "Stream.h"

Nan::Persistent<v8::Function> FormatContext::constructor;

NAN_METHOD(FormatContext::New) {
    auto fmt = new FormatContext();
    fmt->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

NAN_METHOD(FormatContext::NewStream) {
    FormatContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("allocOutputContext").c_str());
        return;
    }
    AVStream* stream = avformat_new_stream(ctx->value,nullptr);
    if(!stream) {
        Nan::ThrowError("Failed to create new stream");
        return;
    }
    v8::Local<v8::Object> result;
    result = Nan::NewInstance(Nan::New(Stream::constructor),0,nullptr).ToLocalChecked();
    Stream* instance;
    if(!TypeConverter::Unwrap(result, &instance)) {
        Nan::ThrowError("Failed to unwrap stream instance");
        return;
    }
    if(!instance->setStream(stream)) {
        Nan::ThrowError("Failed to update stream instance with new stream");
        return;
    }
    info.GetReturnValue().Set(result);
}


NAN_METHOD(FormatContext::AllocOutputContext) {
    FormatContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("allocOutputContext").c_str());
        return;
    }
    if(!TypeConverter::GetArgument(info[0],ctx->filename)) {
        Nan::ThrowError("First argument must be a valid string");
        return;
    }
    int status = avformat_alloc_output_context2(&ctx->value,nullptr, nullptr, ctx->filename.c_str());
    if(status < 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
    ctx->allocationType = AllocationType::AllocOutputContext;
}

NAN_METHOD(FormatContext::FindBestStream) {
    FormatContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("findStreamInfo").c_str());
        return;
    }
    int mediaTypeInt;
    if(!TypeConverter::GetArgument(info[0],mediaTypeInt)) {
        Nan::ThrowError("First argument must be a valid AVMediaType enum item");
        return;
    }
    auto mediaType = static_cast<AVMediaType>(mediaTypeInt);
    int stream = av_find_best_stream(ctx->value,mediaType,-1,-1,nullptr,0);
    if(stream != 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(stream).c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(stream));
}

NAN_METHOD(FormatContext::FindStreamInfo) {
    FormatContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("findStreamInfo").c_str());
        return;
    }
    int status = avformat_find_stream_info(ctx->value,nullptr);
    if(status != 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(FormatContext::OpenInput) {
    std::string url;
    if(!TypeConverter::GetArgument(info[0],url)) {
        Nan::ThrowError("First argument must be a valid string");
        return;
    }
    FormatContext* ctx;
    if(!TypeConverter::Unwrap(info.This(),&ctx)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("openInput").c_str());
        return;
    }
    int status = avformat_open_input(&ctx->value,url.c_str(),nullptr,nullptr);
    if(status != 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
    ctx->allocationType = AllocationType::OpenInput;
}

NAN_METHOD(FormatContext::Streams) {
    FormatContext* fmt;
    if(!TypeConverter::Unwrap<FormatContext>(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("streams").c_str());
        return;
    }
    if(!fmt->streams.IsEmpty()) {
        info.GetReturnValue().Set(Nan::New(fmt->streams));
        return;
    }
    auto streams = Nan::New<v8::Array>();
    unsigned int i;
    Stream* stream;
    v8::Local<v8::Object> streamObj;
    for(i = 0; i < fmt->value->nb_streams; i++) {
        streamObj = Nan::NewInstance(Nan::New(Stream::constructor),0,nullptr).ToLocalChecked();
        if(!TypeConverter::Unwrap(streamObj,&stream)) {
            Nan::ThrowError("Failed to unwrap Stream instance from stream object");
            return;
        }
        if(!stream->setStream(fmt->value->streams[i])){
            Nan::ThrowError("Failed to set new AVStream to stream internal instance");
            return;
        }
        Nan::Set(streams,Nan::New(i), streamObj);
    }
    fmt->streams.Reset(streams);
    info.GetReturnValue().Set(streams);
}

NAN_METHOD(FormatContext::WriteHeader) {
    FormatContext* fmt;
    if(!TypeConverter::Unwrap<FormatContext>(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("writeHeader").c_str());
        return;
    }
    int status = avformat_write_header(fmt->value,nullptr);
    if(status < 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(FormatContext::DumpFormat) {
    FormatContext* fmt;
    if(!TypeConverter::Unwrap<FormatContext>(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("dumpFormat").c_str());
        return;
    }
    int index;
    std::string url;
    bool isOutput;
    if(!TypeConverter::GetArgument(info[0],index)) {
        Nan::ThrowError("First argument must be a valid 32-bit integer");
        return;
    }
    if(!TypeConverter::GetArgument(info[1],url)) {
        Nan::ThrowError("Second argument must be a valid string");
        return;
    }
    if(!TypeConverter::GetArgument(info[2],isOutput)) {
        Nan::ThrowError("Third argument must be a valid boolean");
        return;
    }
    av_dump_format(fmt->value,index,url.c_str(),isOutput ? 1 : 0);
}

NAN_METHOD(FormatContext::WriteFrame) {
    FormatContext* fmt;
    if(!TypeConverter::Unwrap(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("writeFrame").c_str());
        return;
    }
    Packet* pkt;
    if(!TypeConverter::Unwrap(info[0],&pkt)) {
        Nan::ThrowError("First argument must be a valid Packet instance");
        return;
    }
    info.GetReturnValue().Set(Nan::New(av_write_frame(fmt->value,pkt->value)));
}

NAN_METHOD(FormatContext::WriteTrailer) {
    FormatContext* fmt;
    if(!TypeConverter::Unwrap<FormatContext>(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("close").c_str());
        return;
    }
    int status = av_write_trailer(fmt->value);
    if(status < 0) {
        Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
        return;
    }
}

NAN_METHOD(FormatContext::Close){
    FormatContext* fmt;
    if(!TypeConverter::Unwrap<FormatContext>(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("close").c_str());
        return;
    }
    if (!(fmt->value->flags & AVFMT_NOFILE)) {
        avio_closep(&fmt->value->pb);
    }
}


NAN_METHOD(FormatContext::Open) {
    FormatContext* fmt;
    if(!TypeConverter::Unwrap<FormatContext>(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("open").c_str());
        return;
    }
    int status;
    if (!(fmt->value->oformat->flags & AVFMT_NOFILE)) {
        status = avio_open(&fmt->value->pb, fmt->filename.c_str(), AVIO_FLAG_WRITE);
        if (status < 0) {
            Nan::ThrowError(ErrorUtility::GetAVError(status).c_str());
            return;
        }
    }
}

NAN_METHOD(FormatContext::ReadFrame) {
    Packet* pkt;
    if(!TypeConverter::Unwrap<Packet>(info[0],&pkt)) {
        Nan::ThrowError("First argument must be a valid instance of Packet");
        return;
    }
    FormatContext* fmt;
    if(!TypeConverter::Unwrap<FormatContext>(info.This(),&fmt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("readFrame").c_str());
        return;
    }
    int status = av_read_frame(fmt->value,pkt->value);
    info.GetReturnValue().Set(Nan::New(status));
}

void FormatContext::Init(v8::Local<v8::Object> exports) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);

    tpl->SetClassName(Nan::New("FormatContext").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(tpl,"openInput",OpenInput);
    Nan::SetPrototypeMethod(tpl,"allocOutputContext",AllocOutputContext);
    Nan::SetPrototypeMethod(tpl,"readFrame",ReadFrame);
    Nan::SetPrototypeMethod(tpl,"writeFrame",WriteFrame);
    Nan::SetPrototypeMethod(tpl,"dumpFormat",DumpFormat);
    Nan::SetPrototypeMethod(tpl,"newStream",NewStream);
    Nan::SetPrototypeMethod(tpl,"writeHeader",WriteHeader);
    Nan::SetPrototypeMethod(tpl,"open",Open);
    Nan::SetPrototypeMethod(tpl,"close",Close);
    Nan::SetPrototypeMethod(tpl,"writeTrailer",WriteTrailer);
    Nan::SetPrototypeMethod(tpl,"streams",Streams);
    Nan::SetPrototypeMethod(tpl,"findStreamInfo",FindStreamInfo);
    Nan::SetPrototypeMethod(tpl,"findBestStream",FindBestStream);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(
        exports,
        Nan::New("FormatContext").ToLocalChecked(),
        Nan::GetFunction(tpl).ToLocalChecked()
    );
}

FormatContext::FormatContext(): value(nullptr) {

}

FormatContext::~FormatContext() {
    switch(allocationType) {
        case AllocationType::None:
            break;
        case AllocationType::AllocOutputContext:
            avformat_free_context(value);
            break;
        case AllocationType::OpenInput:
            avformat_close_input(&value);
            break;
    }
}
