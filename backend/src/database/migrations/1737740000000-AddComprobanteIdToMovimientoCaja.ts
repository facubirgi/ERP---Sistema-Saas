import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: AddComprobanteIdToMovimientoCaja
 *
 * Agrega la columna comprobante_id a la tabla movimiento_caja para
 * vincular directamente los movimientos con los comprobantes de venta.
 *
 * Esto permite:
 * - Identificar qué movimientos corresponden a qué ventas
 * - Facilitar la anulación de ventas desde caja
 * - Mejorar la trazabilidad de los movimientos
 */
export class AddComprobanteIdToMovimientoCaja1737740000000
  implements MigrationInterface
{
  name = 'AddComprobanteIdToMovimientoCaja1737740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna comprobante_id (nullable porque movimientos existentes no tendrán este valor)
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      ADD COLUMN "comprobante_id" uuid NULL
    `);

    // 2. Crear índice para búsquedas por comprobante
    await queryRunner.query(`
      CREATE INDEX "IDX_movimiento_caja_comprobante_id"
      ON "movimiento_caja" ("comprobante_id")
    `);

    // 3. Agregar foreign key hacia comprobante con ON DELETE SET NULL
    // (si se elimina el comprobante, el movimiento permanece pero sin referencia)
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      ADD CONSTRAINT "FK_movimiento_caja_comprobante"
      FOREIGN KEY ("comprobante_id")
      REFERENCES "comprobante"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar foreign key
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      DROP CONSTRAINT "FK_movimiento_caja_comprobante"
    `);

    // 2. Eliminar índice
    await queryRunner.query(`
      DROP INDEX "IDX_movimiento_caja_comprobante_id"
    `);

    // 3. Eliminar columna
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      DROP COLUMN "comprobante_id"
    `);
  }
}
