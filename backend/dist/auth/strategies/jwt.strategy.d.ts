import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload, User } from '../auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly authService;
    private readonly logger;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<User>;
}
export {};
