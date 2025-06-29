import { AsrStrategy } from './asr.strategy';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
const FormData = require('form-data');

export interface OpenAIWhisperConfig {
  apiKey: string;
  model?: 'whisper-1';
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
  maxRetries?: number;
  timeout?: number;
}

@Injectable()
export class OpenAIWhisperApiStrategy implements AsrStrategy {
  private readonly logger = new Logger(OpenAIWhisperApiStrategy.name);
  private readonly config: OpenAIWhisperConfig & { 
    model: 'whisper-1';
    responseFormat: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    temperature: number;
    maxRetries: number;
    timeout: number;
  };

  constructor(config: OpenAIWhisperConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required for Whisper API strategy');
    }

    this.config = {
      model: 'whisper-1',
      language: 'es', // Spanish - closest to wayuunaiki
      responseFormat: 'text',
      temperature: 0,
      maxRetries: 3,
      timeout: 60000, // 60 seconds
      ...config,
    };

    this.logger.log('✅ OpenAI Whisper API strategy initialized');
  }

  async transcribe(audioPath: string): Promise<string> {
    this.logger.log(`Starting OpenAI Whisper API transcription for: ${audioPath}`);
    
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    // Check file size (OpenAI has 25MB limit)
    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    if (fileSizeInMB > 25) {
      throw new Error(`File too large: ${fileSizeInMB.toFixed(2)}MB. OpenAI Whisper API has a 25MB limit.`);
    }

    this.logger.log(`File size: ${fileSizeInMB.toFixed(2)}MB - within limits`);

    let attempt = 0;
    let lastError: Error;

    while (attempt < this.config.maxRetries) {
      attempt++;
      
      try {
        this.logger.log(`Transcription attempt ${attempt}/${this.config.maxRetries}`);
        
        const transcription = await this.makeTranscriptionRequest(audioPath);
        
        this.logger.log(`✅ Transcription successful: "${transcription.substring(0, 100)}..."`);
        return transcription;
        
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.config.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`OpenAI Whisper API failed after ${this.config.maxRetries} attempts. Last error: ${lastError.message}`);
  }

  private async makeTranscriptionRequest(audioPath: string): Promise<string> {
    const form = new FormData();
    
    // Add the audio file
    form.append('file', fs.createReadStream(audioPath));
    
    // Add required parameters
    form.append('model', this.config.model);
    
    // Add optional parameters
    if (this.config.language) {
      form.append('language', this.config.language);
    }
    
    if (this.config.prompt) {
      form.append('prompt', this.config.prompt);
    }
    
    if (this.config.responseFormat) {
      form.append('response_format', this.config.responseFormat);
    }
    
    if (this.config.temperature !== undefined) {
      form.append('temperature', this.config.temperature.toString());
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          timeout: this.config.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      // Handle different response formats
      if (this.config.responseFormat === 'json' || this.config.responseFormat === 'verbose_json') {
        return response.data.text || '';
      } else {
        return response.data || '';
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // API returned an error response
          const status = error.response.status;
          const message = error.response.data?.error?.message || error.message;
          
          if (status === 429) {
            throw new Error(`Rate limit exceeded: ${message}`);
          } else if (status === 413) {
            throw new Error(`File too large: ${message}`);
          } else if (status === 400) {
            throw new Error(`Bad request: ${message}`);
          } else if (status === 401) {
            throw new Error(`Invalid API key: ${message}`);
          } else {
            throw new Error(`API error (${status}): ${message}`);
          }
        } else if (error.code === 'ECONNABORTED') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        } else {
          throw new Error(`Network error: ${error.message}`);
        }
      } else {
        throw new Error(`Unexpected error: ${error.message}`);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods
  getConfig(): Omit<OpenAIWhisperConfig, 'apiKey'> {
    const { apiKey, ...configWithoutKey } = this.config;
    return configWithoutKey;
  }

  async getAccountUsage(): Promise<{ hasApiKey: boolean; model: string }> {
    return {
      hasApiKey: !!this.config.apiKey,
      model: this.config.model,
    };
  }

  getSupportedFormats(): string[] {
    return [
      'flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 
      'oga', 'ogg', 'wav', 'webm'
    ];
  }

  getMaxFileSize(): string {
    return '25 MB';
  }

  getEstimatedCost(durationMinutes: number): string {
    const costPerMinute = 0.006; // $0.006 per minute
    const totalCost = durationMinutes * costPerMinute;
    return `$${totalCost.toFixed(4)}`;
  }
} 