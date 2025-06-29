import { AsrStrategy } from './asr.strategy';
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface WhisperConfig {
  model: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language?: string;
  task?: 'transcribe' | 'translate';
  outputFormat?: 'txt' | 'json' | 'srt' | 'vtt';
  enableFallback?: boolean;
  fallbackApiKey?: string;
  fallbackProvider?: 'openai' | 'google' | 'azure';
}

@Injectable()
export class WhisperAsrStrategy implements AsrStrategy {
  private readonly logger = new Logger(WhisperAsrStrategy.name);
  private readonly config: WhisperConfig;
  private whisperInstalled: boolean = false;

  constructor(config?: Partial<WhisperConfig>) {
    this.config = {
      model: 'small', // Good balance of speed/accuracy
      language: 'es', // Spanish - closest to wayuunaiki
      task: 'transcribe',
      outputFormat: 'txt',
      enableFallback: true,
      ...config,
    };
    this.checkWhisperInstallation();
  }

  async transcribe(audioPath: string): Promise<string> {
    this.logger.log(`Starting transcription for: ${audioPath}`);
    
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    try {
      // Try local Whisper first
      if (this.whisperInstalled) {
        this.logger.log(`Using local Whisper model: ${this.config.model}`);
        return await this.transcribeWithWhisper(audioPath);
      }
      
      // Fallback to cloud API if enabled
      if (this.config.enableFallback) {
        this.logger.warn('Local Whisper not available, using cloud fallback');
        return await this.transcribeWithCloudApi(audioPath);
      }
      
      throw new Error('No ASR method available');
      
    } catch (error) {
      this.logger.error(`Transcription failed: ${error.message}`);
      
      // Try fallback if not already tried
      if (this.whisperInstalled && this.config.enableFallback) {
        this.logger.log('Retrying with cloud API fallback');
        try {
          return await this.transcribeWithCloudApi(audioPath);
        } catch (fallbackError) {
          this.logger.error(`Fallback also failed: ${fallbackError.message}`);
        }
      }
      
      throw error;
    }
  }

  private async transcribeWithWhisper(audioPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputDir = path.dirname(audioPath);
      const outputFile = path.join(outputDir, `${path.basename(audioPath, path.extname(audioPath))}_transcription.txt`);
      
      const args = [
        audioPath,
        '--model', this.config.model,
        '--output_dir', outputDir,
        '--output_format', this.config.outputFormat,
      ];

      if (this.config.language) {
        args.push('--language', this.config.language);
      }

      if (this.config.task) {
        args.push('--task', this.config.task);
      }

      this.logger.log(`Executing whisper with args: ${args.join(' ')}`);
      
      const whisperProcess = spawn('whisper', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      whisperProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      whisperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.debug(`Whisper stderr: ${data.toString().trim()}`);
      });

      whisperProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Read the generated transcription file
            if (fs.existsSync(outputFile)) {
              const transcription = fs.readFileSync(outputFile, 'utf-8').trim();
              
              // Clean up temporary file
              fs.unlinkSync(outputFile);
              
              this.logger.log(`Whisper transcription completed: "${transcription.substring(0, 100)}..."`);
              resolve(transcription);
            } else {
              // If no output file, try to get from stdout
              const transcription = stdout.trim() || 'No transcription generated';
              resolve(transcription);
            }
          } catch (error) {
            reject(new Error(`Failed to read transcription: ${error.message}`));
          }
        } else {
          reject(new Error(`Whisper process failed with code ${code}: ${stderr}`));
        }
      });

      whisperProcess.on('error', (error) => {
        reject(new Error(`Failed to start whisper process: ${error.message}`));
      });
    });
  }

  private async transcribeWithCloudApi(audioPath: string): Promise<string> {
    switch (this.config.fallbackProvider) {
      case 'openai':
        return this.transcribeWithOpenAI(audioPath);
      case 'google':
        return this.transcribeWithGoogle(audioPath);
      case 'azure':
        return this.transcribeWithAzure(audioPath);
      default:
        return this.transcribeWithOpenAI(audioPath); // Default fallback
    }
  }

  private async transcribeWithOpenAI(audioPath: string): Promise<string> {
    if (!this.config.fallbackApiKey) {
      throw new Error('OpenAI API key not configured for fallback');
    }

    const FormData = require('form-data');
    const axios = require('axios');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('model', 'whisper-1');
    form.append('language', this.config.language || 'es');

    try {
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.config.fallbackApiKey}`,
        },
      });

      return response.data.text;
    } catch (error) {
      throw new Error(`OpenAI API transcription failed: ${error.message}`);
    }
  }

  private async transcribeWithGoogle(audioPath: string): Promise<string> {
    // Placeholder for Google Speech-to-Text implementation
    throw new Error('Google Speech-to-Text not implemented yet');
  }

  private async transcribeWithAzure(audioPath: string): Promise<string> {
    // Placeholder for Azure Speech implementation
    throw new Error('Azure Speech not implemented yet');
  }

  private async checkWhisperInstallation(): Promise<void> {
    try {
      const { spawn } = require('child_process');
      const whisperCheck = spawn('whisper', ['--help'], { stdio: 'pipe' });
      
      whisperCheck.on('close', (code) => {
        this.whisperInstalled = code === 0;
        if (this.whisperInstalled) {
          this.logger.log(`✅ Whisper is installed and available`);
        } else {
          this.logger.warn(`⚠️ Whisper not found. Install with: pip install openai-whisper`);
        }
      });

      whisperCheck.on('error', () => {
        this.whisperInstalled = false;
        this.logger.warn(`⚠️ Whisper not found. Install with: pip install openai-whisper`);
      });
    } catch (error) {
      this.whisperInstalled = false;
      this.logger.error(`Error checking Whisper installation: ${error.message}`);
    }
  }

  // Utility methods
  getModelInfo(): { model: string; size: string; ramRequired: string } {
    const modelInfo = {
      tiny: { size: '39 MB', ramRequired: '1 GB' },
      base: { size: '74 MB', ramRequired: '1 GB' },
      small: { size: '244 MB', ramRequired: '2 GB' },
      medium: { size: '769 MB', ramRequired: '5 GB' },
      large: { size: '1550 MB', ramRequired: '10 GB' },
    };

    return {
      model: this.config.model,
      ...modelInfo[this.config.model],
    };
  }

  isLocalAvailable(): boolean {
    return this.whisperInstalled;
  }

  isFallbackEnabled(): boolean {
    return this.config.enableFallback || false;
  }
} 