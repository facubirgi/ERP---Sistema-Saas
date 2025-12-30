/**
 * Type definitions for Express Request extensions
 *
 * This file extends the Express Request interface to include custom properties
 * that are added by our authentication and authorization guards.
 */

declare namespace Express {
  /**
   * Extended Request interface with authentication and tenant context
   */
  export interface Request {
    /**
     * User object attached by JwtAuthGuard after successful authentication
     * Contains decoded JWT payload
     */
    user?: {
      /** User ID (UUID) */
      userId: string;
      /** User email */
      email: string;
      /** Company/Tenant ID (UUID) */
      empresaId: string;
      /** User role (DUEÑO or EMPLEADO) */
      rol: 'DUEÑO' | 'EMPLEADO';
    };

    /**
     * Tenant ID attached by TenantGuard
     * Extracted from user.empresaId for easier access in services
     */
    tenantId?: string;
  }
}
