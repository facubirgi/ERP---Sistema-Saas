import { ApiError } from '../types/common.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Global handler for 401 errors
let unauthorizedHandler: (() => void) | null = null;

export class BaseApiClient {
  /**
   * Set global handler for 401 Unauthorized errors
   * This will be called whenever any API request receives a 401 response
   */
  static setUnauthorizedHandler(handler: () => void) {
    unauthorizedHandler = handler;
  }

  protected static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return headers;
  }

  protected static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Error en la solicitud',
      }));

      const apiError: ApiError = {
        message: error.message || 'Error en la solicitud',
        statusCode: response.status,
        error: error.error,
      };

      // Call unauthorized handler if 401 response
      if (response.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }

      throw apiError;
    }

    // Manejar respuestas sin contenido (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return response.json();
  }

  protected static async get<T>(
    endpoint: string
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include', // Send httpOnly cookies
    });

    return this.handleResponse<T>(response);
  }

  protected static async post<T, D = unknown>(
    endpoint: string,
    data: D
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include', // Send httpOnly cookies
    });

    return this.handleResponse<T>(response);
  }

  protected static async put<T, D = unknown>(
    endpoint: string,
    data: D
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include', // Send httpOnly cookies
    });

    return this.handleResponse<T>(response);
  }

  protected static async patch<T, D = unknown>(
    endpoint: string,
    data: D
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include', // Send httpOnly cookies
    });

    return this.handleResponse<T>(response);
  }

  protected static async delete<T>(
    endpoint: string
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include', // Send httpOnly cookies
    });

    return this.handleResponse<T>(response);
  }
}
