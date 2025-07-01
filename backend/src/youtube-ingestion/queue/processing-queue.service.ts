import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface QueueJob {
  id: string;
  type: 'transcription' | 'translation' | 'download';
  videoId: string;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
}

@Injectable()
export class ProcessingQueueService extends EventEmitter {
  private readonly logger = new Logger(ProcessingQueueService.name);
  private readonly queue: QueueJob[] = [];
  private readonly processing: Map<string, QueueJob> = new Map();
  private readonly completed: QueueJob[] = [];
  private readonly failed: QueueJob[] = [];
  
  private readonly maxConcurrentJobs = 2;
  private readonly defaultMaxAttempts = 3;
  private readonly retryDelays = [5000, 15000, 60000];
  private readonly jobTimeout = 300000;
  
  private isProcessing = false;

  constructor() {
    super();
    this.startProcessing();
  }

  addJob(job: Omit<QueueJob, 'id' | 'attempts' | 'createdAt'>): string {
    const jobId = `${job.type}_${job.videoId}_${Date.now()}`;
    const fullJob: QueueJob = {
      ...job,
      id: jobId,
      attempts: 0,
      createdAt: new Date(),
      maxAttempts: job.maxAttempts || this.defaultMaxAttempts,
    };

    const insertIndex = this.queue.findIndex(q => q.priority < fullJob.priority);
    if (insertIndex === -1) {
      this.queue.push(fullJob);
    } else {
      this.queue.splice(insertIndex, 0, fullJob);
    }

    this.logger.log(`📋 Job añadido: ${jobId} (tipo: ${job.type})`);
    this.emit('jobAdded', fullJob);
    
    return jobId;
  }

  getStats(): QueueStats {
    const retrying = this.queue.filter(job => job.attempts > 0).length;
    
    return {
      pending: this.queue.length - retrying,
      processing: this.processing.size,
      completed: this.completed.length,
      failed: this.failed.length,
      retrying,
    };
  }

  completeJob(jobId: string, result?: any): void {
    const job = this.processing.get(jobId);
    if (!job) return;

    job.completedAt = new Date();
    this.processing.delete(jobId);
    this.completed.push(job);

    this.logger.log(`✅ Job completado: ${jobId}`);
    this.emit('jobCompleted', job, result);
  }

  failJob(jobId: string, error: Error): void {
    const job = this.processing.get(jobId);
    if (!job) return;
    this.handleJobError(job, error);
  }

  private startProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.isProcessing) {
      try {
        if (this.processing.size >= this.maxConcurrentJobs) {
          await this.sleep(1000);
          continue;
        }

        const nextJob = this.getNextReadyJob();
        if (!nextJob) {
          await this.sleep(1000);
          continue;
        }

        this.startJob(nextJob);
      } catch (error) {
        this.logger.error('Error en cola:', error);
        await this.sleep(5000);
      }
    }
  }

  private getNextReadyJob(): QueueJob | null {
    const now = new Date();
    
    for (let i = 0; i < this.queue.length; i++) {
      const job = this.queue[i];
      
      if (job.scheduledAt && job.scheduledAt > now) {
        continue;
      }
      
      return this.queue.splice(i, 1)[0];
    }
    
    return null;
  }

  private async startJob(job: QueueJob): Promise<void> {
    job.startedAt = new Date();
    job.attempts++;
    this.processing.set(job.id, job);

    this.logger.log(`🚀 Iniciando: ${job.id} (intento ${job.attempts})`);
    this.emit('jobStarted', job);

    const timeoutId = setTimeout(() => {
      this.handleJobTimeout(job);
    }, this.jobTimeout);

    try {
      this.emit('processJob', job);
    } catch (error) {
      clearTimeout(timeoutId);
      this.handleJobError(job, error);
    }
  }

  private handleJobError(job: QueueJob, error: any): void {
    job.error = error.message || String(error);
    this.processing.delete(job.id);

    this.logger.error(`❌ Job falló: ${job.id} - ${job.error}`);

    if (job.attempts < job.maxAttempts) {
      const delay = this.retryDelays[job.attempts - 1] || this.retryDelays[this.retryDelays.length - 1];
      job.scheduledAt = new Date(Date.now() + delay);
      
      this.queue.unshift(job);
      this.logger.log(`🔄 Reintento programado: ${job.id} en ${delay}ms`);
      this.emit('jobRetrying', job);
      
    } else {
      job.completedAt = new Date();
      this.failed.push(job);
      this.logger.error(`💀 Job fallido definitivamente: ${job.id}`);
      this.emit('jobFailed', job);
    }
  }

  private handleJobTimeout(job: QueueJob): void {
    this.logger.error(`⏰ Timeout: ${job.id}`);
    this.handleJobError(job, new Error(`Timeout after ${this.jobTimeout}ms`));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
