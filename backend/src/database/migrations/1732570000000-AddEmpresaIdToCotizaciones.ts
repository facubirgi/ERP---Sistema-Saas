import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRACIÓN: Agregar campo empresaId a cotizaciones
 *
 * Agrega la columna 'empresa_id' a las tablas 'cotizaciones' e 'items_cotizacion'
 * para implementar multi-tenancy en el módulo de cotizaciones.
 *
 * IMPORTANTE: Esta migración requiere que exista al menos una empresa en la BD
 * o que las tablas estén vacías.
 */
export class AddEmpresaIdToCotizaciones1732570000000
  implements MigrationInterface
{
  name = 'AddEmpresaIdToCotizaciones1732570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas tienen datos
    const cotizacionesCount = (await queryRunner.query(
      `SELECT COUNT(*) as count FROM "cotizaciones"`,
    )) as Array<{ count: string }>;
    const hasData = parseInt(cotizacionesCount[0]?.count || '0', 10) > 0;

    if (hasData) {
      // Si hay datos, obtener el primer empresa_id disponible para asignarlo temporalmente
      const empresa = (await queryRunner.query(
        `SELECT id FROM "empresa" LIMIT 1`,
      )) as Array<{ id: string }>;

      if (!empresa || empresa.length === 0) {
        throw new Error(
          'No se puede ejecutar la migración: existen cotizaciones pero no hay empresas en la BD',
        );
      }

      const empresaId = empresa[0].id;

      // Agregar columna empresa_id a cotizaciones (permitir NULL temporalmente)
      await queryRunner.query(`
        ALTER TABLE "cotizaciones"
        ADD COLUMN "empresa_id" uuid
      `);

      // Asignar empresaId a registros existentes
      await queryRunner.query(`
        UPDATE "cotizaciones"
        SET "empresa_id" = '${empresaId}'
      `);

      // Hacer la columna NOT NULL
      await queryRunner.query(`
        ALTER TABLE "cotizaciones"
        ALTER COLUMN "empresa_id" SET NOT NULL
      `);

      // Agregar columna empresa_id a items_cotizacion (permitir NULL temporalmente)
      await queryRunner.query(`
        ALTER TABLE "items_cotizacion"
        ADD COLUMN "empresa_id" uuid
      `);

      // Asignar empresaId a registros existentes
      await queryRunner.query(`
        UPDATE "items_cotizacion"
        SET "empresa_id" = '${empresaId}'
      `);

      // Hacer la columna NOT NULL
      await queryRunner.query(`
        ALTER TABLE "items_cotizacion"
        ALTER COLUMN "empresa_id" SET NOT NULL
      `);
    } else {
      // Si no hay datos, simplemente agregar las columnas como NOT NULL
      await queryRunner.query(`
        ALTER TABLE "cotizaciones"
        ADD COLUMN "empresa_id" uuid NOT NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "items_cotizacion"
        ADD COLUMN "empresa_id" uuid NOT NULL
      `);
    }

    // Agregar foreign key constraint a cotizaciones
    await queryRunner.query(`
      ALTER TABLE "cotizaciones"
      ADD CONSTRAINT "fk_cotizaciones_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
    `);

    // Agregar foreign key constraint a items_cotizacion
    await queryRunner.query(`
      ALTER TABLE "items_cotizacion"
      ADD CONSTRAINT "fk_items_cotizacion_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
    `);

    // Agregar índices para mejorar el rendimiento de las consultas por empresa
    await queryRunner.query(`
      CREATE INDEX "idx_cotizaciones_empresa_id"
      ON "cotizaciones" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_items_cotizacion_empresa_id"
      ON "items_cotizacion" ("empresa_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_items_cotizacion_empresa_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_cotizaciones_empresa_id"
    `);

    // Eliminar foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "items_cotizacion"
      DROP CONSTRAINT IF EXISTS "fk_items_cotizacion_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "cotizaciones"
      DROP CONSTRAINT IF EXISTS "fk_cotizaciones_empresa"
    `);

    // Eliminar columnas empresa_id
    await queryRunner.query(`
      ALTER TABLE "items_cotizacion"
      DROP COLUMN "empresa_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "cotizaciones"
      DROP COLUMN "empresa_id"
    `);
  }
}
