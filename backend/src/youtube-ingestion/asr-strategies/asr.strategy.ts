export interface AsrStrategy {
  transcribe(audioPath: string): Promise<string>;
} 