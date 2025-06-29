#include "Rational.h"
#include "TypeConverter.h"

Nan::Persistent<v8::Function> Rational::constructor;

void Rational::Init(v8::Local<v8::Object> exports) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("Rational").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(exports,Nan::New("Rational").ToLocalChecked(),Nan::GetFunction(tpl).ToLocalChecked());
}

NAN_METHOD(Rational::New) {
    int num, den;
    if(!TypeConverter::GetArgument(info[0],num)) {
        Nan::ThrowError("First argument must be a valid signed 32-bit integer");
        return;
    }
    if(!TypeConverter::GetArgument(info[1],den)) {
        Nan::ThrowError("First argument must be a valid signed 32-bit integer");
        return;
    }
    auto* obj = new Rational(num, den);
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

Rational::Rational(int num, int den): value { num, den } {

}
