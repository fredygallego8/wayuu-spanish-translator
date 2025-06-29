import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { listFiles } from '@huggingface/hub';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

function hfHubUrl(options: { repo: string; path: string; repoType: 'dataset' | 'model' | 'space' }): string {
    return `https://huggingface.co/${options.repoType}s/${options.repo}/resolve/main/${options.path}`;
}

@Injectable()
export class HuggingfaceService implements OnModuleInit {
  private readonly logger = new Logger(HuggingfaceService.name);
  private readonly sourcesDir = path.join(__dirname, '..', '..', 'data', 'sources');
  private readonly repoId: string;
  private readonly token: string;
  private isConfigured: boolean = false;

  constructor() {
    try {
      dotenv.config(); // Asegurarse de que se cargue
      this.repoId = process.env.HUGGING_FACE_REPO_ID;
      this.token = process.env.HUGGING_FACE_TOKEN;
      
      if (!this.repoId || this.repoId === 'dummy-repo') {
        this.logger.warn('⚠️ Hugging Face Repo ID not configured. Service will run in offline mode.');
        this.isConfigured = false;
        return;
      }

      if (!this.token || this.token === 'dummy-token') {
        this.logger.warn('⚠️ Hugging Face token not configured. Service will run in offline mode.');
        this.isConfigured = false;
        return;
      }

      this.isConfigured = true;
      this.logger.log(`✅ HuggingfaceService initialized for repo: ${this.repoId}`);
    } catch (error) {
      this.logger.error('ERROR during HuggingfaceService constructor', error);
      this.isConfigured = false;
    }
  }

  async onModuleInit() {
    if (!this.isConfigured) {
      this.logger.log('📚 Hugging Face service running in offline mode - using local sources only');
      await this.ensureDirectoryExists(this.sourcesDir);
      return;
    }

    this.logger.log('🔧 Hugging Face service ready for on-demand loading...');
    await this.ensureDirectoryExists(this.sourcesDir);
    
    this.logger.log('✨ Service ready - PDFs and sources will be loaded on-demand by authorized users');
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await fs.mkdir(directory, { recursive: true });
      this.logger.log(`Directory ensured: ${directory}`);
    } catch (error) {
      this.logger.error(`Failed to create directory ${directory}`, error.stack);
    }
  }

  async fetchAndCacheSources() {
    if (!this.isConfigured) {
      this.logger.warn('📚 Hugging Face not configured - skipping remote source fetch');
      return { message: 'Service running in offline mode - using local sources only.' };
    }

    try {
      this.logger.log(`🔄 Fetching file list from repository: ${this.repoId}`);
      const filesIterator = listFiles({
        repo: { type: 'dataset', name: this.repoId },
        credentials: { accessToken: this.token },
      });
      
      const files = [];
      for await (const file of filesIterator) {
        files.push(file.path);
      }

      this.logger.log(`📁 Found ${files.length} files to download.`);

      for (const file of files) {
        if (file.endsWith('.gitattributes') || file.endsWith('README.md')) {
            this.logger.log(`⏭️ Skipping metadata file: ${file}`);
            continue;
        }

        const destinationPath = path.join(this.sourcesDir, path.basename(file));
        this.logger.log(`⬇️ Downloading ${file} to ${destinationPath}...`);
        
        const fileUrl = hfHubUrl({
          repo: this.repoId,
          path: file,
          repoType: 'dataset',
        });

        const response = await fetch(fileUrl, {
            headers: {
                Authorization: `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download ${file}: ${response.statusText}`);
        }

        const fileBuffer = await response.arrayBuffer();
        await fs.writeFile(destinationPath, Buffer.from(fileBuffer));
        this.logger.log(`✅ Successfully cached ${file} to ${destinationPath}`);
      }

      return { 
        message: 'All sources have been successfully cached.',
        files: files.length,
        location: this.sourcesDir
      };
    } catch (error) {
      this.logger.error('❌ Failed to fetch and cache sources from Hugging Face.', error.stack);
      throw error;
    }
  }

  async fetchOrkideaDataset() {
    try {
      this.logger.log('🎵 Fetching Orkidea Wayuu audio dataset...');
      
      const orkideaRepo = 'orkidea/palabrero-guc-draft';
      const orkideaDir = path.join(this.sourcesDir, 'orkidea-wayuu-audio');
      await this.ensureDirectoryExists(orkideaDir);

      const filesIterator = listFiles({
        repo: { type: 'dataset', name: orkideaRepo },
      });
      
      const files = [];
      for await (const file of filesIterator) {
        this.logger.log(`📄 Found file: ${file.path}`);
        if (!file.path.endsWith('.gitattributes') && !file.path.endsWith('README.md')) {
          files.push(file.path);
        }
      }

      this.logger.log(`📁 Found ${files.length} Orkidea dataset files to download.`);

      if (files.length === 0) {
        this.logger.warn('⚠️ No files found in Orkidea dataset');
        return { 
          message: 'No files found in Orkidea dataset to download.',
          files: 0,
          location: orkideaDir
        };
      }

      for (const file of files) {
        const destinationPath = path.join(orkideaDir, path.basename(file));
        this.logger.log(`⬇️ Downloading Orkidea file: ${file}...`);
        
        const fileUrl = hfHubUrl({
          repo: orkideaRepo,
          path: file,
          repoType: 'dataset',
        });

        const response = await fetch(fileUrl);

        if (!response.ok) {
            this.logger.error(`❌ Failed to download ${file}: ${response.statusText}`);
            continue;
        }

        const fileBuffer = await response.arrayBuffer();
        await fs.writeFile(destinationPath, Buffer.from(fileBuffer));
        this.logger.log(`✅ Successfully cached Orkidea file: ${file} (${fileBuffer.byteLength} bytes)`);
      }

      return { 
        message: 'Orkidea Wayuu audio dataset successfully cached.',
        files: files.length,
        location: orkideaDir
      };
    } catch (error) {
      this.logger.error('❌ Failed to fetch Orkidea dataset', error.stack);
      throw error;
    }
  }

  getServiceStatus() {
    return {
      configured: this.isConfigured,
      repoId: this.isConfigured ? this.repoId : 'Not configured',
      hasToken: this.isConfigured && !!this.token,
      sourcesDirectory: this.sourcesDir,
      mode: this.isConfigured ? 'online' : 'offline',
      onDemandLoading: true
    };
  }

  async getCachedFiles(): Promise<{ files: string[], count: number }> {
    try {
      const files = await fs.readdir(this.sourcesDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      return {
        files: pdfFiles,
        count: pdfFiles.length
      };
    } catch (error) {
      this.logger.error('Error reading cached files:', error);
      return { files: [], count: 0 };
    }
  }
}
