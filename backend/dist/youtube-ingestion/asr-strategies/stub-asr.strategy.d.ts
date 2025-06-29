import { AsrStrategy } from './asr.strategy';
export declare class StubAsrStrategy implements AsrStrategy {
    private readonly logger;
    transcribe(audioPath: string): Promise<string>;
}
