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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let AuthService = AuthService_1 = class AuthService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.authorizedUsers = [
            'fgallego@seeed.us',
            'fredy.gallego@gmail.com',
        ];
        this.adminUsers = [
            'fgallego@seeed.us',
            'fredy.gallego@gmail.com',
        ];
    }
    async validateGoogleUser(profile) {
        const { id, emails, displayName, photos } = profile;
        if (!emails || emails.length === 0) {
            this.logger.warn('Google profile missing email');
            return null;
        }
        const email = emails[0].value;
        const isAuthorized = this.isUserAuthorized(email);
        if (!isAuthorized) {
            this.logger.warn(`Unauthorized user attempted login: ${email}`);
            throw new common_1.UnauthorizedException(`Usuario no autorizado: ${email}`);
        }
        const user = {
            id,
            email,
            name: displayName,
            picture: photos?.[0]?.value,
            isAuthorized: true,
            roles: this.getUserRoles(email),
            createdAt: new Date(),
            lastLogin: new Date(),
        };
        this.logger.log(`✅ Authorized user logged in: ${email} with roles: ${user.roles.join(', ')}`);
        return user;
    }
    async generateJwtToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
        };
        return this.jwtService.sign(payload);
    }
    async validateJwtPayload(payload) {
        const { sub, email, name, roles } = payload;
        if (!this.isUserAuthorized(email)) {
            this.logger.warn(`JWT validation failed: User no longer authorized: ${email}`);
            return null;
        }
        return {
            id: sub,
            email,
            name,
            picture: undefined,
            isAuthorized: true,
            roles: this.getUserRoles(email),
            createdAt: new Date(),
            lastLogin: new Date(),
        };
    }
    isUserAuthorized(email) {
        return this.authorizedUsers.includes(email.toLowerCase());
    }
    getUserRoles(email) {
        const roles = ['user'];
        if (this.adminUsers.includes(email.toLowerCase())) {
            roles.push('admin');
        }
        return roles;
    }
    getAuthorizedUsers() {
        return [...this.authorizedUsers];
    }
    getAdminUsers() {
        return [...this.adminUsers];
    }
    canManageResources(user) {
        return user.roles.includes('admin');
    }
    getAuthStats() {
        return {
            totalAuthorizedUsers: this.authorizedUsers.length,
            totalAdminUsers: this.adminUsers.length,
            maxUsers: 100,
            remainingSlots: 100 - this.authorizedUsers.length,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map