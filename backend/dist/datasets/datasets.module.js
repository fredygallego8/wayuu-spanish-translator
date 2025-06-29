"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const datasets_service_1 = require("./datasets.service");
const datasets_controller_1 = require("./datasets.controller");
const audio_duration_service_1 = require("./audio-duration.service");
const metrics_module_1 = require("../metrics.module");
const common_2 = require("@nestjs/common");
let DatasetsModule = class DatasetsModule {
};
exports.DatasetsModule = DatasetsModule;
exports.DatasetsModule = DatasetsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, (0, common_2.forwardRef)(() => metrics_module_1.MetricsModule)],
        controllers: [datasets_controller_1.DatasetsController],
        providers: [datasets_service_1.DatasetsService, audio_duration_service_1.AudioDurationService],
        exports: [datasets_service_1.DatasetsService, audio_duration_service_1.AudioDurationService],
    })
], DatasetsModule);
//# sourceMappingURL=datasets.module.js.map