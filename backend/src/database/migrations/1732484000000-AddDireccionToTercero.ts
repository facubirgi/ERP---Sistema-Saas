import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRACIÓN: Agregar campo dirección a tercero
 *
 * Agrega la columna 'direccion' a la tabla 'tercero'
 * para almacenar la dirección física o de entrega
 * de clientes y proveedores.
 */
export class AddDireccionToTercero1732484000000 implements MigrationInterface {
  name = 'AddDireccionToTercero1732484000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna direccion a la tabla tercero
    await queryRunner.query(`
      ALTER TABLE "tercero"
      ADD COLUMN "direccion" character varying(300)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar columna direccion de la tabla tercero
    await queryRunner.query(`
      ALTER TABLE "tercero"
      DROP COLUMN "direccion"
    `);
  }
}
