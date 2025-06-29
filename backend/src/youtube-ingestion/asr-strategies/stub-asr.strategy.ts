import { AsrStrategy } from './asr.strategy';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StubAsrStrategy implements AsrStrategy {
  private readonly logger = new Logger(StubAsrStrategy.name);

  async transcribe(audioPath: string): Promise<string> {
    this.logger.log(`[Stub] Transcribing audio from: ${audioPath}`);
    const mockTranscription = `This is a mock transcription for the audio file at ${audioPath}. The real transcription would be generated here.`;
    
    return Promise.resolve(mockTranscription);
  }
} 