"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StubAsrStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StubAsrStrategy = void 0;
const common_1 = require("@nestjs/common");
let StubAsrStrategy = StubAsrStrategy_1 = class StubAsrStrategy {
    constructor() {
        this.logger = new common_1.Logger(StubAsrStrategy_1.name);
    }
    async transcribe(audioPath) {
        this.logger.log(`[Stub] Transcribing audio from: ${audioPath}`);
        const mockTranscription = `This is a mock transcription for the audio file at ${audioPath}. The real transcription would be generated here.`;
        return Promise.resolve(mockTranscription);
    }
};
exports.StubAsrStrategy = StubAsrStrategy;
exports.StubAsrStrategy = StubAsrStrategy = StubAsrStrategy_1 = __decorate([
    (0, common_1.Injectable)()
], StubAsrStrategy);
//# sourceMappingURL=stub-asr.strategy.js.map