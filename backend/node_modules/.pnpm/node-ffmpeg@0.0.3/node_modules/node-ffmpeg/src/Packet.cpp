#include "Packet.h"
#include "TypeConverter.h"
#include "ErrorUtility.h"

#include <unordered_map>

Nan::Persistent<v8::Function> Packet::constructor;

NAN_METHOD(Packet::New) {
    auto pkt = new Packet();
    pkt->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Packet::Data) {
    Packet* pkt;
    if(!TypeConverter::Unwrap(info.This(),&pkt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("data").c_str());
        return;
    }
    pkt->data.Reset(v8::ArrayBuffer::New(
        Nan::GetCurrentContext()->GetIsolate(),
        pkt->value->data,
        pkt->value->size,
        v8::ArrayBufferCreationMode::kExternalized
    ));
    info.GetReturnValue().Set(Nan::New(pkt->data));
}

NAN_METHOD(Packet::Unref){
    Packet* pkt;
    if(!TypeConverter::Unwrap(info.This(),&pkt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("update").c_str());
        return;
    }
    av_packet_unref(pkt->value);
}

NAN_METHOD(Packet::Update){
    Packet* pkt;
    if(!TypeConverter::Unwrap(info.This(),&pkt)) {
        Nan::ThrowError(ErrorUtility::ThrowInvalidThis("update").c_str());
        return;
    }
    if(!info[0]->IsObject() || info[0]->IsNull()) {
        return;
    }
    auto params = Nan::To<v8::Object>(info[0]).ToLocalChecked();
    std::unordered_map<std::string, int64_t&> longProps {
        {"pts",pkt->value->pts}
    };
    for(auto& p : longProps) {
        auto value = Nan::Get(params,Nan::New(p.first).ToLocalChecked()).ToLocalChecked();
        if(!TypeConverter::GetArgument(value,p.second)){
            continue;
        }
    }
}

void Packet::Init(v8::Local<v8::Object> exports) {
    auto tpl = Nan::New<v8::FunctionTemplate>(New);

    tpl->SetClassName(Nan::New("Packet").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeMethod(tpl,"data",Data);
    Nan::SetPrototypeMethod(tpl,"update",Update);
    Nan::SetPrototypeMethod(tpl,"unref",Unref);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());

    Nan::Set(
        exports,
        Nan::New("Packet").ToLocalChecked(),
        Nan::GetFunction(tpl).ToLocalChecked()
    );
}

Packet::Packet(): value(av_packet_alloc()) {

}

Packet::~Packet() {
    av_packet_free(&value);
}
