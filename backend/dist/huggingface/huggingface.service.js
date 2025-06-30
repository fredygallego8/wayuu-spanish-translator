"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HuggingfaceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingfaceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const hub_1 = require("@huggingface/hub");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
function hfHubUrl(options) {
    return `https://huggingface.co/${options.repoType}s/${options.repo}/resolve/main/${options.path}`;
}
let HuggingfaceService = HuggingfaceService_1 = class HuggingfaceService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(HuggingfaceService_1.name);
        this.sourcesDir = path.join(__dirname, '..', '..', 'data', 'sources');
        this.isConfigured = false;
        try {
            this.repoId = this.configService.get('HUGGING_FACE_REPO_ID');
            this.token = this.configService.get('HUGGING_FACE_TOKEN');
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
        }
        catch (error) {
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
    async ensureDirectoryExists(directory) {
        try {
            await fs.mkdir(directory, { recursive: true });
            this.logger.log(`Directory ensured: ${directory}`);
        }
        catch (error) {
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
            const filesIterator = (0, hub_1.listFiles)({
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
        }
        catch (error) {
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
            const filesIterator = (0, hub_1.listFiles)({
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
        }
        catch (error) {
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
    async getCachedFiles() {
        try {
            const files = await fs.readdir(this.sourcesDir);
            const pdfFiles = files.filter(file => file.endsWith('.pdf'));
            return {
                files: pdfFiles,
                count: pdfFiles.length
            };
        }
        catch (error) {
            this.logger.error('Error reading cached files:', error);
            return { files: [], count: 0 };
        }
    }
};
exports.HuggingfaceService = HuggingfaceService;
exports.HuggingfaceService = HuggingfaceService = HuggingfaceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HuggingfaceService);
//# sourceMappingURL=huggingface.service.js.map