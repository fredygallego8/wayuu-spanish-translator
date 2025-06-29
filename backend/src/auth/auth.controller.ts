import { 
  Controller, 
  Get, 
  Post, 
  UseGuards, 
  Req, 
  Res, 
  Logger,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService, User } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('🔐 Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: '🚀 Iniciar autenticación con Google',
    description: 'Redirige al usuario a Google OAuth para autenticación'
  })
  @ApiResponse({ status: 302, description: 'Redirección a Google OAuth' })
  async googleAuth(@Req() req: Request) {
    // Passport maneja la redirección automáticamente
    this.logger.log('🔐 Iniciando autenticación Google OAuth...');
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: '🔄 Callback de Google OAuth',
    description: 'Procesa la respuesta de Google y genera JWT token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Autenticación exitosa - redirige al frontend con token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } }
          }
        },
        token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Usuario no autorizado' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as User;
      
      if (!user) {
        this.logger.warn('❌ Google callback sin usuario válido');
        return res.redirect(`http://localhost:4000/frontend/?error=auth_failed`);
      }

      const token = await this.authService.generateJwtToken(user);
      
      this.logger.log(`✅ Usuario autenticado exitosamente: ${user.email}`);
      
      // Redirigir al frontend con el token
      const frontendUrl = `http://localhost:4000/frontend/?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles
      }))}`;
      
      return res.redirect(frontendUrl);
    } catch (error) {
      this.logger.error('❌ Error en callback de Google:', error.message);
      return res.redirect(`http://localhost:4000/frontend/?error=callback_error`);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '👤 Obtener perfil del usuario',
    description: 'Obtiene la información del usuario autenticado'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil del usuario',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        isAuthorized: { type: 'boolean' },
        lastLogin: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async getProfile(@CurrentUser() user: User) {
    this.logger.log(`📱 Perfil solicitado por: ${user.email}`);
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      isAuthorized: user.isAuthorized,
      lastLogin: user.lastLogin
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '🚪 Cerrar sesión',
    description: 'Invalida el token JWT del usuario'
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(@CurrentUser() user: User) {
    this.logger.log(`🚪 Usuario cerró sesión: ${user.email}`);
    
    // En un sistema más robusto, aquí invalidaríamos el token en una blacklist
    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    };
  }

  @Get('status')
  @ApiOperation({ 
    summary: '🔍 Estado de autenticación',
    description: 'Verificar estado del sistema de autenticación'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del sistema de autenticación',
    schema: {
      type: 'object',
      properties: {
        authEnabled: { type: 'boolean' },
        googleOAuthConfigured: { type: 'boolean' },
        stats: {
          type: 'object',
          properties: {
            totalAuthorizedUsers: { type: 'number' },
            maxUsers: { type: 'number' },
            remainingSlots: { type: 'number' }
          }
        }
      }
    }
  })
  getAuthStatus() {
    const stats = this.authService.getAuthStats();
    
    return {
      authEnabled: true,
      googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      stats,
      timestamp: new Date().toISOString()
    };
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '👥 Listar usuarios autorizados (Admin)',
    description: 'Obtiene la lista de usuarios autorizados - Solo administradores'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios autorizados',
    schema: {
      type: 'object',
      properties: {
        authorizedUsers: { type: 'array', items: { type: 'string' } },
        adminUsers: { type: 'array', items: { type: 'string' } },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            admins: { type: 'number' },
            remaining: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Requiere rol admin' })
  async getAuthorizedUsers(@CurrentUser() user: User) {
    if (!this.authService.canManageResources(user)) {
      throw new ForbiddenException('Acceso denegado - Requiere permisos de administrador');
    }

    this.logger.log(`👥 Admin ${user.email} consultó lista de usuarios`);

    return {
      authorizedUsers: this.authService.getAuthorizedUsers(),
      adminUsers: this.authService.getAdminUsers(),
      stats: this.authService.getAuthStats()
    };
  }

  @Get('health')
  @ApiOperation({ 
    summary: '🏥 Health check del sistema de auth',
    description: 'Verificar salud del sistema de autenticación'
  })
  @ApiResponse({ status: 200, description: 'Sistema de autenticación funcionando' })
  getHealthCheck() {
    return {
      status: 'healthy',
      service: 'auth',
      timestamp: new Date().toISOString(),
      googleOAuth: {
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
        callbackUrlConfigured: !!process.env.GOOGLE_CALLBACK_URL
      },
      jwt: {
        secretConfigured: !!process.env.JWT_SECRET,
        expiresInConfigured: !!process.env.JWT_EXPIRES_IN
      }
    };
  }
} 