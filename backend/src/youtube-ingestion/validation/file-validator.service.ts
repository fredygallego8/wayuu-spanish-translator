import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    size: number;
    duration?: number;
    format?: string;
    sampleRate?: number;
    bitrate?: number;
  };
}

@Injectable()
export class FileValidatorService {
  private readonly logger = new Logger(FileValidatorService.name);

  async validateFile(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fileInfo: {
        size: 0,
      },
    };

    try {
      if (!fs.existsSync(filePath)) {
        result.errors.push('File does not exist');
        result.isValid = false;
        return result;
      }

      const stats = fs.statSync(filePath);
      result.fileInfo.size = stats.size;

      if (stats.size < 1024) {
        result.errors.push('File is too small (less than 1KB)');
        result.isValid = false;
      }

      if (stats.size > 100 * 1024 * 1024) {
        result.warnings.push('File is very large (>100MB), processing may be slow');
      }

      await this.validateWithFfprobe(filePath, result);
      await this.checkFileIntegrity(filePath, result);

    } catch (error) {
      this.logger.error(`File validation failed: ${error.message}`);
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  private async validateWithFfprobe(filePath: string, result: ValidationResult): Promise<void> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
        { timeout: 30000 }
      );

      const info = JSON.parse(stdout);
      
      if (!info.format) {
        result.errors.push('Invalid file format - cannot read media information');
        result.isValid = false;
        return;
      }

      result.fileInfo.duration = parseFloat(info.format.duration) || 0;
      result.fileInfo.format = info.format.format_name;
      result.fileInfo.bitrate = parseInt(info.format.bit_rate) || 0;

      const audioStream = info.streams?.find(stream => stream.codec_type === 'audio');
      if (audioStream) {
        result.fileInfo.sampleRate = parseInt(audioStream.sample_rate) || 0;
      }

      if (result.fileInfo.duration === 0) {
        result.warnings.push('Could not determine file duration');
      } else if (result.fileInfo.duration < 1) {
        result.warnings.push('File is very short (less than 1 second)');
      } else if (result.fileInfo.duration > 3600) {
        result.warnings.push('File is very long (>1 hour), processing may take significant time');
      }

      if (!audioStream) {
        result.errors.push('No audio stream found in file');
        result.isValid = false;
      }

    } catch (error) {
      this.logger.warn(`ffprobe validation failed: ${error.message}`);
      result.warnings.push('Could not validate file format with ffprobe');
      this.validateByExtension(filePath, result);
    }
  }

  private validateByExtension(filePath: string, result: ValidationResult): void {
    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = ['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.avi', '.mov', '.mkv', '.webm'];

    if (!supportedFormats.includes(ext)) {
      result.errors.push(`Unsupported file format: ${ext}`);
      result.isValid = false;
    } else {
      result.fileInfo.format = ext.substring(1);
    }
  }

  private async checkFileIntegrity(filePath: string, result: ValidationResult): Promise<void> {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(1024);
      
      fs.readSync(fd, buffer, 0, 1024, 0);
      
      if (result.fileInfo.size > 2048) {
        fs.readSync(fd, buffer, 0, 1024, result.fileInfo.size - 1024);
      }
      
      fs.closeSync(fd);

      const isAllZeros = buffer.every(byte => byte === 0);
      if (isAllZeros && result.fileInfo.size > 1024) {
        result.warnings.push('File appears to contain only zero bytes - may be corrupted');
      }

    } catch (error) {
      result.warnings.push(`Could not verify file integrity: ${error.message}`);
    }
  }

  getValidationSummary(result: ValidationResult): string {
    const status = result.isValid ? '✅ VALID' : '❌ INVALID';
    const size = (result.fileInfo.size / 1024 / 1024).toFixed(2);
    const duration = result.fileInfo.duration ? `${result.fileInfo.duration.toFixed(1)}s` : 'unknown';
    const format = result.fileInfo.format || 'unknown';
    
    let summary = `${status} - ${size}MB, ${duration}, ${format}`;
    
    if (result.errors.length > 0) {
      summary += ` - Errors: ${result.errors.length}`;
    }
    
    if (result.warnings.length > 0) {
      summary += ` - Warnings: ${result.warnings.length}`;
    }
    
    return summary;
  }

  async checkFfprobeAvailability(): Promise<boolean> {
    try {
      await execAsync('ffprobe -version', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn('ffprobe not available - file validation will be limited');
      return false;
    }
  }
}
