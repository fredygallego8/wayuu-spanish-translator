import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastCheck: Date;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  lastUpdate: Date;
  uptime: number;
}

@Injectable()
export class PipelineHealthService {
  private readonly logger = new Logger(PipelineHealthService.name);
  private readonly audioPath = path.join(__dirname, '..', '..', '..', 'data', 'youtube-audio');
  private readonly startTime = Date.now();
  
  private healthChecks: HealthCheck[] = [];
  private readonly checkInterval = 60000; // 1 minuto
  private healthTimer?: NodeJS.Timeout;

  constructor() {
    this.startHealthMonitoring();
  }

  private startHealthMonitoring(): void {
    this.logger.log('🏥 Iniciando monitoreo de salud del pipeline');
    this.runAllHealthChecks();
    
    this.healthTimer = setInterval(() => {
      this.runAllHealthChecks();
    }, this.checkInterval);
  }

  private async runAllHealthChecks(): Promise<void> {
    const checks = await Promise.allSettled([
      this.checkDiskSpace(),
      this.checkYtDlpAvailability(),
      this.checkWhisperAvailability(),
      this.checkAudioDirectory(),
      this.checkDatabaseIntegrity(),
      this.checkSystemResources(),
      this.checkNetworkConnectivity(),
    ]);

    const checkNames = [
      'Disk Space',
      'yt-dlp Availability', 
      'Whisper Availability',
      'Audio Directory',
      'Database Integrity',
      'System Resources',
      'Network Connectivity'
    ];

    this.healthChecks = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: checkNames[index],
          status: 'critical' as const,
          message: `Health check failed: ${result.reason}`,
          lastCheck: new Date(),
        };
      }
    });

    this.logHealthSummary();
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    try {
      const { stdout } = await execAsync(`df -h "${this.audioPath}" | tail -1`);
      const parts = stdout.trim().split(/\s+/);
      const usagePercent = parseInt(parts[4].replace('%', ''));
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = `Disk usage: ${usagePercent}%`;

      if (usagePercent > 90) {
        status = 'critical';
        message += ' - CRITICAL: Disk almost full!';
      } else if (usagePercent > 80) {
        status = 'warning';
        message += ' - WARNING: Disk space running low';
      }

      return {
        name: 'Disk Space',
        status,
        message,
        lastCheck: new Date(),
        details: { usagePercent, available: parts[3] },
      };
    } catch (error) {
      return {
        name: 'Disk Space',
        status: 'critical',
        message: `Failed to check disk space: ${error.message}`,
        lastCheck: new Date(),
      };
    }
  }

  private async checkYtDlpAvailability(): Promise<HealthCheck> {
    try {
      const { stdout } = await execAsync('yt-dlp --version', { timeout: 10000 });
      const version = stdout.trim();
      
      return {
        name: 'yt-dlp Availability',
        status: 'healthy',
        message: `yt-dlp available (${version})`,
        lastCheck: new Date(),
        details: { version },
      };
    } catch (error) {
      return {
        name: 'yt-dlp Availability',
        status: 'critical',
        message: `yt-dlp not available: ${error.message}`,
        lastCheck: new Date(),
      };
    }
  }

  private async checkWhisperAvailability(): Promise<HealthCheck> {
    try {
      await execAsync('whisper --help', { timeout: 10000 });
      
      return {
        name: 'Whisper Availability',
        status: 'healthy',
        message: 'Whisper ASR available',
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        name: 'Whisper Availability',
        status: 'critical',
        message: `Whisper not available: ${error.message}`,
        lastCheck: new Date(),
      };
    }
  }

  private async checkAudioDirectory(): Promise<HealthCheck> {
    try {
      if (!fs.existsSync(this.audioPath)) {
        fs.mkdirSync(this.audioPath, { recursive: true });
      }

      const testFile = path.join(this.audioPath, '.health_check');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);

      const files = fs.readdirSync(this.audioPath);
      const audioFiles = files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));

      return {
        name: 'Audio Directory',
        status: 'healthy',
        message: `Audio directory accessible (${audioFiles.length} audio files)`,
        lastCheck: new Date(),
        details: { path: this.audioPath, audioFiles: audioFiles.length },
      };
    } catch (error) {
      return {
        name: 'Audio Directory',
        status: 'critical',
        message: `Audio directory issues: ${error.message}`,
        lastCheck: new Date(),
      };
    }
  }

  private async checkDatabaseIntegrity(): Promise<HealthCheck> {
    try {
      const dbPath = path.join(this.audioPath, 'ingestion-db.json');
      
      if (!fs.existsSync(dbPath)) {
        return {
          name: 'Database Integrity',
          status: 'warning',
          message: 'Database file does not exist (will be created)',
          lastCheck: new Date(),
        };
      }

      const data = fs.readFileSync(dbPath, 'utf-8');
      const db = JSON.parse(data);
      const recordCount = Object.keys(db).length;

      let corruptedRecords = 0;
      for (const [id, record] of Object.entries(db)) {
        if (!record || typeof record !== 'object' || !(record as any).videoId || !(record as any).status) {
          corruptedRecords++;
        }
      }

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = `Database healthy (${recordCount} records)`;

      if (corruptedRecords > 0) {
        status = corruptedRecords > recordCount * 0.1 ? 'critical' : 'warning';
        message += ` - ${corruptedRecords} corrupted records detected`;
      }

      return {
        name: 'Database Integrity',
        status,
        message,
        lastCheck: new Date(),
        details: { recordCount, corruptedRecords },
      };
    } catch (error) {
      return {
        name: 'Database Integrity',
        status: 'critical',
        message: `Database corrupted: ${error.message}`,
        lastCheck: new Date(),
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheck> {
    try {
      const { stdout: memInfo } = await execAsync('free -m');
      const memLines = memInfo.split('\n');
      const memLine = memLines[1].split(/\s+/);
      const totalMem = parseInt(memLine[1]);
      const usedMem = parseInt(memLine[2]);
      const memUsagePercent = Math.round((usedMem / totalMem) * 100);

      const { stdout: loadInfo } = await execAsync('uptime');
      const loadMatch = loadInfo.match(/load average: ([\d.]+)/);
      const cpuLoad = loadMatch ? parseFloat(loadMatch[1]) : 0;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = `Memory: ${memUsagePercent}%, CPU Load: ${cpuLoad}`;

      if (memUsagePercent > 90 || cpuLoad > 4) {
        status = 'critical';
        message += ' - CRITICAL: High resource usage!';
      } else if (memUsagePercent > 80 || cpuLoad > 2) {
        status = 'warning';
        message += ' - WARNING: Elevated resource usage';
      }

      return {
        name: 'System Resources',
        status,
        message,
        lastCheck: new Date(),
        details: { memUsagePercent, cpuLoad, totalMemMB: totalMem },
      };
    } catch (error) {
      return {
        name: 'System Resources',
        status: 'warning',
        message: `Could not check system resources: ${error.message}`,
        lastCheck: new Date(),
      };
    }
  }

  private async checkNetworkConnectivity(): Promise<HealthCheck> {
    try {
      await execAsync('curl -s --max-time 10 https://www.youtube.com > /dev/null');
      
      return {
        name: 'Network Connectivity',
        status: 'healthy',
        message: 'Network connectivity to YouTube verified',
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        name: 'Network Connectivity',
        status: 'critical',
        message: `Network connectivity issues: ${error.message}`,
        lastCheck: new Date(),
      };
    }
  }

  getSystemHealth(): SystemHealth {
    const criticalIssues = this.healthChecks.filter(check => check.status === 'critical');
    const warnings = this.healthChecks.filter(check => check.status === 'warning');

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalIssues.length > 0) {
      overall = 'critical';
    } else if (warnings.length > 0) {
      overall = 'warning';
    }

    return {
      overall,
      checks: this.healthChecks,
      lastUpdate: new Date(),
      uptime: Date.now() - this.startTime,
    };
  }

  getChecksByStatus(status: 'healthy' | 'warning' | 'critical'): HealthCheck[] {
    return this.healthChecks.filter(check => check.status === status);
  }

  async forceHealthCheck(): Promise<SystemHealth> {
    this.logger.log('🔄 Ejecutando checks de salud forzados...');
    await this.runAllHealthChecks();
    return this.getSystemHealth();
  }

  private logHealthSummary(): void {
    const health = this.getSystemHealth();
    const critical = this.getChecksByStatus('critical');
    const warnings = this.getChecksByStatus('warning');

    if (critical.length > 0) {
      this.logger.error(`🚨 CRITICAL ISSUES (${critical.length}): ${critical.map(c => c.name).join(', ')}`);
    }

    if (warnings.length > 0) {
      this.logger.warn(`⚠️ WARNINGS (${warnings.length}): ${warnings.map(c => c.name).join(', ')}`);
    }

    if (health.overall === 'healthy') {
      this.logger.log('✅ All health checks passed');
    }
  }

  stopHealthMonitoring(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = undefined;
      this.logger.log('🛑 Health monitoring stopped');
    }
  }
} 