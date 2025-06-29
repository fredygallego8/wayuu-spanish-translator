#include "Stream.h"
#include "CodecParameters.h"
#include "TypeConverter.h"
#include "ErrorUtility.h"
#include "Rational.h"

#include <unordered_map>

Nan::Persistent<v8::Function> Stream::constructor;

void Stream::Init(v8::Local<v8::Object>) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("Stream").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(tpl,"id",Id);
    Nan::SetPrototypeMethod(tpl,"timeBase",TimeBase);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

//    Nan::Set(exports,Nan::New("Stream").ToLocalChecked(),Nan::GetFunction(tpl).ToLocalChecked());
}

NAN_METHOD(Stream::TimeBase){
    Rational* newTimeBase;
    Stream* stream;
    if(!TypeConverter::Unwrap(info.This(),&stream)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("id()").c_str());
        return;
    }
    if(!TypeConverter::Unwrap(info[0],&newTimeBase)) {
        Nan::ThrowError("First argument must be a valid Rational instance");
        return;
    }
    stream->value->time_base = newTimeBase->value;
}

NAN_METHOD(Stream::New){
    auto stream = new Stream();
    stream->Wrap(info.This());
    std::unordered_map<std::string,v8::Local<v8::Value>> props {
        {"codecParameters",Nan::New(stream->codecParameters)}
    };
    for(auto& i : props) {
        Nan::Set(
            info.This(),
            Nan::New(i.first).ToLocalChecked(),
            i.second
        );
    }
    info.GetReturnValue().Set(info.This());
}

Stream::~Stream() {

}

Stream::Stream():
    codecParameters(Nan::NewInstance(Nan::New(CodecParameters::constructor),0,nullptr).ToLocalChecked())
{

}

NAN_METHOD(Stream::Id) {
    Stream* stream;
    if(!TypeConverter::Unwrap(info.This(),&stream)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("id()").c_str());
        return;
    }
    info.GetReturnValue().Set(Nan::New(stream->value->id));
}

bool Stream::setStream(AVStream* stream) {
    value = stream;
    CodecParameters* codecpar;
    if(!TypeConverter::Unwrap(Nan::New(codecParameters),&codecpar)) {
        return false;
    }
    if(!codecpar->update(stream->codecpar,CodecParametersCreationMode::Externalized)) {
        return false;
    }
    return true;
}
