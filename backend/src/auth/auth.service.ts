import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isAuthorized: boolean;
  roles: string[];
  createdAt: Date;
  lastLogin?: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Lista de usuarios autorizados (hasta 100 usuarios gratuitos)
  private readonly authorizedUsers: string[] = [
    'fgallego@seeed.us',
    'fredy.gallego@gmail.com',
    // Agregar más emails autorizados aquí
  ];

  // Admin users que pueden gestionar recursos
  private readonly adminUsers: string[] = [
    'fgallego@seeed.us',
    'fredy.gallego@gmail.com',
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateGoogleUser(profile: any): Promise<User | null> {
    const { id, emails, displayName, photos } = profile;
    
    if (!emails || emails.length === 0) {
      this.logger.warn('Google profile missing email');
      return null;
    }

    const email = emails[0].value;
    const isAuthorized = this.isUserAuthorized(email);
    
    if (!isAuthorized) {
      this.logger.warn(`Unauthorized user attempted login: ${email}`);
      throw new UnauthorizedException(`Usuario no autorizado: ${email}`);
    }

    const user: User = {
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

  async generateJwtToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    };

    return this.jwtService.sign(payload);
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    const { sub, email, name, roles } = payload;
    
    // Verificar que el usuario sigue autorizado
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
      roles: this.getUserRoles(email), // Re-evaluar roles dinámicamente
      createdAt: new Date(),
      lastLogin: new Date(),
    };
  }

  private isUserAuthorized(email: string): boolean {
    return this.authorizedUsers.includes(email.toLowerCase());
  }

  private getUserRoles(email: string): string[] {
    const roles = ['user'];
    
    if (this.adminUsers.includes(email.toLowerCase())) {
      roles.push('admin');
    }

    return roles;
  }

  // Métodos para gestión de autorizaciones
  getAuthorizedUsers(): string[] {
    return [...this.authorizedUsers];
  }

  getAdminUsers(): string[] {
    return [...this.adminUsers];
  }

  canManageResources(user: User): boolean {
    return user.roles.includes('admin');
  }

  getAuthStats() {
    return {
      totalAuthorizedUsers: this.authorizedUsers.length,
      totalAdminUsers: this.adminUsers.length,
      maxUsers: 100, // Límite gratuito de Google OAuth
      remainingSlots: 100 - this.authorizedUsers.length,
    };
  }
} 