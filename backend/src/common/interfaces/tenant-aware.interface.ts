/**
 * Interface for entities that are tenant-aware
 * All entities that belong to a specific tenant should implement this
 */
export interface TenantAware {
  empresaId: number;
}

/**
 * Type guard to check if an entity is tenant-aware
 */
export function isTenantAware(entity: unknown): entity is TenantAware {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'empresaId' in entity &&
    typeof (entity as TenantAware).empresaId === 'number'
  );
}
