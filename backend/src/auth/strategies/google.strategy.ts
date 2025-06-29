import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3002/api/auth/google/callback',
      scope: ['email', 'profile'],
    });

    this.logger.log('🔐 Google OAuth Strategy initialized');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      this.logger.log(`🔍 Validating Google user: ${profile.emails?.[0]?.value}`);
      
      const user = await this.authService.validateGoogleUser(profile);
      
      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      this.logger.error('❌ Google OAuth validation error:', error.message);
      return done(error, null);
    }
  }
} 