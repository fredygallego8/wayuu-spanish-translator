"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async googleAuth(req) {
        this.logger.log('🔐 Iniciando autenticación Google OAuth...');
    }
    async googleAuthCallback(req, res) {
        try {
            const user = req.user;
            if (!user) {
                this.logger.warn('❌ Google callback sin usuario válido');
                return res.redirect(`http://localhost:4000/frontend/?error=auth_failed`);
            }
            const token = await this.authService.generateJwtToken(user);
            this.logger.log(`✅ Usuario autenticado exitosamente: ${user.email}`);
            const frontendUrl = `http://localhost:4000/frontend/?token=${token}&user=${encodeURIComponent(JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles
            }))}`;
            return res.redirect(frontendUrl);
        }
        catch (error) {
            this.logger.error('❌ Error en callback de Google:', error.message);
            return res.redirect(`http://localhost:4000/frontend/?error=callback_error`);
        }
    }
    async getProfile(user) {
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
    async logout(user) {
        this.logger.log(`🚪 Usuario cerró sesión: ${user.email}`);
        return {
            success: true,
            message: 'Sesión cerrada exitosamente'
        };
    }
    getAuthStatus() {
        const stats = this.authService.getAuthStats();
        return {
            authEnabled: true,
            googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
            stats,
            timestamp: new Date().toISOString()
        };
    }
    async getAuthorizedUsers(user) {
        if (!this.authService.canManageResources(user)) {
            throw new common_1.ForbiddenException('Acceso denegado - Requiere permisos de administrador');
        }
        this.logger.log(`👥 Admin ${user.email} consultó lista de usuarios`);
        return {
            authorizedUsers: this.authService.getAuthorizedUsers(),
            adminUsers: this.authService.getAdminUsers(),
            stats: this.authService.getAuthStats()
        };
    }
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
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, swagger_1.ApiOperation)({
        summary: '🚀 Iniciar autenticación con Google',
        description: 'Redirige al usuario a Google OAuth para autenticación'
    }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirección a Google OAuth' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, swagger_1.ApiOperation)({
        summary: '🔄 Callback de Google OAuth',
        description: 'Procesa la respuesta de Google y genera JWT token'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Usuario no autorizado' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthCallback", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '👤 Obtener perfil del usuario',
        description: 'Obtiene la información del usuario autenticado'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token inválido o expirado' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '🚪 Cerrar sesión',
        description: 'Invalida el token JWT del usuario'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sesión cerrada exitosamente' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: '🔍 Estado de autenticación',
        description: 'Verificar estado del sistema de autenticación'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getAuthStatus", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '👥 Listar usuarios autorizados (Admin)',
        description: 'Obtiene la lista de usuarios autorizados - Solo administradores'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Acceso denegado - Requiere rol admin' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAuthorizedUsers", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({
        summary: '🏥 Health check del sistema de auth',
        description: 'Verificar salud del sistema de autenticación'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sistema de autenticación funcionando' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getHealthCheck", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('🔐 Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map