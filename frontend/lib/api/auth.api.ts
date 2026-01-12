import { BaseApiClient } from './base.api';
import {
  RegisterDto,
  LoginDto,
  RegisterResponse,
  LoginResponse,
} from '../types/auth.types';

/**
 * Auth API Service
 * Handles authentication-related API calls
 */
export class AuthApi extends BaseApiClient {
  /**
   * Register a new empresa and owner user
   */
  static async register(data: RegisterDto): Promise<RegisterResponse> {
    return this.post<RegisterResponse>('/auth/register', data);
  }

  /**
   * Login with empresa email, user email and password
   */
  static async login(data: LoginDto): Promise<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', data);
  }

  /**
   * Logout - clears httpOnly cookie on server
   */
  static async logout(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/logout', {});
  }

  /**
   * Validate current session - checks if JWT token is valid
   */
  static async validateSession(): Promise<{
    valid: boolean;
    usuario: {
      id: number;
      email: string;
      nombre: string;
      rol: string;
      empresaId: number;
    };
    empresa: {
      id: number;
      razonSocial: string;
    };
  }> {
    return this.get('/auth/validate');
  }
}
