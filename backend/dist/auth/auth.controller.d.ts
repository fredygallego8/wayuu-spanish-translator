import { Request, Response } from 'express';
import { AuthService, User } from './auth.service';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    googleAuth(req: Request): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
    getProfile(user: User): Promise<{
        id: string;
        email: string;
        name: string;
        roles: string[];
        isAuthorized: boolean;
        lastLogin: Date;
    }>;
    logout(user: User): Promise<{
        success: boolean;
        message: string;
    }>;
    getAuthStatus(): {
        authEnabled: boolean;
        googleOAuthConfigured: boolean;
        stats: {
            totalAuthorizedUsers: number;
            totalAdminUsers: number;
            maxUsers: number;
            remainingSlots: number;
        };
        timestamp: string;
    };
    getAuthorizedUsers(user: User): Promise<{
        authorizedUsers: string[];
        adminUsers: string[];
        stats: {
            totalAuthorizedUsers: number;
            totalAdminUsers: number;
            maxUsers: number;
            remainingSlots: number;
        };
    }>;
    getHealthCheck(): {
        status: string;
        service: string;
        timestamp: string;
        googleOAuth: {
            configured: boolean;
            clientIdConfigured: boolean;
            clientSecretConfigured: boolean;
            callbackUrlConfigured: boolean;
        };
        jwt: {
            secretConfigured: boolean;
            expiresInConfigured: boolean;
        };
    };
}
