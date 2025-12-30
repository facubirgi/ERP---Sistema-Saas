import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventarioModule1732220000000 implements MigrationInterface {
  name = 'CreateInventarioModule1732220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. HABILITAR EXTENSIÓN UUID
    // ========================================
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    // ========================================
    // 2. CREAR TABLA CATEGORIA
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "categoria" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying(100) NOT NULL,
        "descripcion" text,
        "empresa_id" uuid NOT NULL,
        "eliminado" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categoria" PRIMARY KEY ("id")
      )
    `);

    // Índice único compuesto: empresa + nombre (solo para no eliminados)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_categoria_empresa_nombre_unique"
      ON "categoria" ("empresa_id", "nombre")
      WHERE eliminado = false
    `);

    // Índices adicionales
    await queryRunner.query(`
      CREATE INDEX "IDX_categoria_empresa_id" ON "categoria" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categoria_empresa_eliminado" ON "categoria" ("empresa_id", "eliminado")
    `);

    // Foreign key de categoria a empresa
    await queryRunner.query(`
      ALTER TABLE "categoria"
      ADD CONSTRAINT "FK_categoria_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // ========================================
    // 3. CREAR TABLA PRODUCTO
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "producto" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "codigo_barras" character varying(50),
        "nombre" character varying(200) NOT NULL,
        "precio_costo" decimal(10,2) NOT NULL,
        "precio_venta" decimal(10,2) NOT NULL,
        "stock_actual" integer NOT NULL DEFAULT 0,
        "stock_minimo" integer NOT NULL DEFAULT 5,
        "categoria_id" uuid NOT NULL,
        "empresa_id" uuid NOT NULL,
        "eliminado" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_producto" PRIMARY KEY ("id")
      )
    `);

    // Índice único compuesto parcial: empresa + código de barras (solo para códigos no nulos)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_producto_empresa_codigo_barras_unique"
      ON "producto" ("empresa_id", "codigo_barras")
      WHERE codigo_barras IS NOT NULL
    `);

    // Índices adicionales
    await queryRunner.query(`
      CREATE INDEX "IDX_producto_empresa_id" ON "producto" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_producto_empresa_categoria" ON "producto" ("empresa_id", "categoria_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_producto_empresa_nombre" ON "producto" ("empresa_id", "nombre")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_producto_empresa_stock" ON "producto" ("empresa_id", "stock_actual")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_producto_empresa_eliminado" ON "producto" ("empresa_id", "eliminado")
    `);

    // Foreign key de producto a categoria (RESTRICT - no se puede eliminar categoría con productos)
    await queryRunner.query(`
      ALTER TABLE "producto"
      ADD CONSTRAINT "FK_producto_categoria"
      FOREIGN KEY ("categoria_id")
      REFERENCES "categoria"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    // Foreign key de producto a empresa
    await queryRunner.query(`
      ALTER TABLE "producto"
      ADD CONSTRAINT "FK_producto_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // ========================================
    // 4. COMENTARIOS EN LAS TABLAS
    // ========================================
    await queryRunner.query(`
      COMMENT ON TABLE "categoria" IS 'Categorías de productos del sistema'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "categoria"."eliminado" IS 'Soft delete - permite mantener historial'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "producto" IS 'Productos del inventario'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "producto"."codigo_barras" IS 'Código de barras único por empresa (nullable)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "producto"."stock_actual" IS 'Stock disponible actual'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "producto"."stock_minimo" IS 'Nivel mínimo de stock para alertas'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. DROP FOREIGN KEYS
    // ========================================
    await queryRunner.query(`
      ALTER TABLE "producto" DROP CONSTRAINT "FK_producto_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "producto" DROP CONSTRAINT "FK_producto_categoria"
    `);

    await queryRunner.query(`
      ALTER TABLE "categoria" DROP CONSTRAINT "FK_categoria_empresa"
    `);

    // ========================================
    // 2. DROP ÍNDICES
    // ========================================
    // Índices de producto
    await queryRunner.query(
      `DROP INDEX "public"."IDX_producto_empresa_eliminado"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_stock"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_producto_empresa_nombre"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_producto_empresa_categoria"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_producto_empresa_codigo_barras_unique"`,
    );

    // Índices de categoria
    await queryRunner.query(
      `DROP INDEX "public"."IDX_categoria_empresa_eliminado"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_categoria_empresa_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_categoria_empresa_nombre_unique"`,
    );

    // ========================================
    // 3. DROP TABLAS
    // ========================================
    await queryRunner.query(`DROP TABLE "producto"`);
    await queryRunner.query(`DROP TABLE "categoria"`);

    // ========================================
    // 4. DROP EXTENSIÓN UUID (OPCIONAL)
    // ========================================
    // Nota: No eliminamos la extensión porque puede ser usada por otras tablas
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
