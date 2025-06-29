"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingfaceModule = void 0;
const common_1 = require("@nestjs/common");
const huggingface_controller_1 = require("./huggingface/huggingface.controller");
const huggingface_service_1 = require("./huggingface/huggingface.service");
let HuggingfaceModule = class HuggingfaceModule {
};
exports.HuggingfaceModule = HuggingfaceModule;
exports.HuggingfaceModule = HuggingfaceModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [huggingface_controller_1.HuggingfaceController],
        providers: [huggingface_service_1.HuggingfaceService],
    })
], HuggingfaceModule);
//# sourceMappingURL=huggingface.module.js.map