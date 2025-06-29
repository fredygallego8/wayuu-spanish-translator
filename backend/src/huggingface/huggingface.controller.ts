import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';

import { HuggingfaceService } from './huggingface.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/auth.service';

@ApiTags('📚 Datasets')
@Controller('huggingface')
export class HuggingfaceController {
    constructor(private readonly huggingfaceService: HuggingfaceService) {}

    @Get('status')
    @ApiOperation({ 
        summary: '📊 Estado del servicio Hugging Face',
        description: 'Obtiene el estado actual del servicio y configuración'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Estado del servicio',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string' },
                service: {
                    type: 'object',
                    properties: {
                        configured: { type: 'boolean' },
                        mode: { type: 'string' },
                        onDemandLoading: { type: 'boolean' }
                    }
                },
                timestamp: { type: 'string' }
            }
        }
    })
    getStatus() {
        return {
            status: 'active',
            service: this.huggingfaceService.getServiceStatus(),
            timestamp: new Date().toISOString()
        };
    }

    @Get('cached-files')
    @ApiOperation({ 
        summary: '📄 Archivos en caché',
        description: 'Lista los archivos PDF ya descargados en caché local'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de archivos en caché',
        schema: {
            type: 'object',
            properties: {
                files: { type: 'array', items: { type: 'string' } },
                count: { type: 'number' },
                location: { type: 'string' }
            }
        }
    })
    async getCachedFiles() {
        const cachedFiles = await this.huggingfaceService.getCachedFiles();
        return {
            ...cachedFiles,
            location: this.huggingfaceService.getServiceStatus().sourcesDirectory
        };
    }

    // 🔒 ENDPOINT PROTEGIDO - Solo usuarios autorizados
    @Post('fetch-sources')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: '⬇️ Descargar fuentes principales (Admin)',
        description: '🔒 Descarga y almacena en caché las fuentes del repositorio principal - Solo administradores'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Fuentes descargadas exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                files: { type: 'number' },
                location: { type: 'string' },
                downloadedBy: { type: 'string' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Token de acceso requerido' })
    @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
    @ApiResponse({ status: 400, description: 'Error en la configuración' })
    async fetchSources(@CurrentUser() user: User) {
        const result = await this.huggingfaceService.fetchAndCacheSources();
        
        return {
            ...result,
            downloadedBy: user.email,
            timestamp: new Date().toISOString()
        };
    }

    // 🔒 ENDPOINT PROTEGIDO - Solo usuarios autorizados
    @Post('fetch-orkidea-dataset')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: '🎵 Descargar dataset Orkidea Wayuu (Admin)',
        description: '🔒 Descarga el dataset orkidea/palabrero-guc-draft con audio wayuu - Solo administradores'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Dataset Orkidea descargado exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                files: { type: 'number' },
                location: { type: 'string' },
                downloadedBy: { type: 'string' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Token de acceso requerido' })
    @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
    @ApiResponse({ status: 500, description: 'Error al descargar el dataset' })
    async fetchOrkideaDataset(@CurrentUser() user: User) {
        const result = await this.huggingfaceService.fetchOrkideaDataset();
        
        return {
            ...result,
            downloadedBy: user.email,
            timestamp: new Date().toISOString()
        };
    }
}
