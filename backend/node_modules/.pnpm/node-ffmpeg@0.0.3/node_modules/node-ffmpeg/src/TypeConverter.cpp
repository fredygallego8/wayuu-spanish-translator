#include "TypeConverter.h"

bool TypeConverter::GetArgument(v8::Local<v8::Value> val,std::string& out) {
    if(!val->IsString()) {
        return false;
    }
    auto len = Nan::DecodeBytes(val);
    char value[len];
    Nan::DecodeWrite(value, len, val);
    out = std::string(value,len);
    return true;
}

bool TypeConverter::GetArgument(v8::Local<v8::Value> val, uint32_t& out) {
    if(!val->IsUint32()) {
        return false;
    }
    out = Nan::To<v8::Uint32>(val).ToLocalChecked()->Value();
    return true;
}

bool TypeConverter::GetArgument(v8::Local<v8::Value> val, int32_t& out) {
    if(!val->IsInt32()) {
        return false;
    }
    out = Nan::To<v8::Int32>(val).ToLocalChecked()->Value();
    return true;
}

bool TypeConverter::GetArgument(v8::Local<v8::Value> val, uint64_t& out) {
    if(!val->IsNumber()) {
        return false;
    }
    out = Nan::To<v8::Integer>(val).ToLocalChecked()->Value();
    return true;
}

bool TypeConverter::GetArgument(v8::Local<v8::Value> val, double& out) {
    if(!val->IsNumber()) {
        return false;
    }
    out = Nan::To<v8::Number>(val).ToLocalChecked()->Value();
    return false;
}

bool TypeConverter::GetArgument(v8::Local<v8::Value> val, int64_t& out) {
    if(!val->IsNumber()) {
        return false;
    }
    out = Nan::To<v8::Integer>(val).ToLocalChecked()->Value();
    return true;
}

bool TypeConverter::GetArgument(v8::Local<v8::Value> val, bool& out) {
    if(!val->IsBoolean()) {
        return false;
    }
    out = Nan::To<v8::Boolean>(val).ToLocalChecked()->Value();
    return true;
}
