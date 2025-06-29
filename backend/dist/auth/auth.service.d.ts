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
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly authorizedUsers;
    private readonly adminUsers;
    constructor(jwtService: JwtService, configService: ConfigService);
    validateGoogleUser(profile: any): Promise<User | null>;
    generateJwtToken(user: User): Promise<string>;
    validateJwtPayload(payload: JwtPayload): Promise<User | null>;
    private isUserAuthorized;
    private getUserRoles;
    getAuthorizedUsers(): string[];
    getAdminUsers(): string[];
    canManageResources(user: User): boolean;
    getAuthStats(): {
        totalAuthorizedUsers: number;
        totalAdminUsers: number;
        maxUsers: number;
        remainingSlots: number;
    };
}
