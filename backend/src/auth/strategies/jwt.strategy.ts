import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload, User } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'wayuu-translator-secret-key',
    });

    this.logger.log('🔑 JWT Strategy initialized');
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      this.logger.debug(`🔍 Validating JWT for user: ${payload.email}`);
      
      const user = await this.authService.validateJwtPayload(payload);
      
      if (!user) {
        this.logger.warn(`❌ JWT validation failed for user: ${payload.email}`);
        throw new UnauthorizedException('Token inválido o usuario no autorizado');
      }

      return user;
    } catch (error) {
      this.logger.error('❌ JWT validation error:', error.message);
      throw new UnauthorizedException('Token inválido');
    }
  }
} 