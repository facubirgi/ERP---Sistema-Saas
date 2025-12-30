import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVentasModule1732234800000 implements MigrationInterface {
  name = 'CreateVentasModule1732234800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. CREAR ENUMS
    // ========================================

    // Enum para tipo de tercero
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_tercero_enum" AS ENUM('CLIENTE', 'PROVEEDOR')
    `);

    // Enum para tipo de comprobante
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_comprobante_enum" AS ENUM('VENTA', 'COTIZACION')
    `);

    // Enum para estado de pago
    await queryRunner.query(`
      CREATE TYPE "public"."estado_pago_enum" AS ENUM('PENDIENTE', 'PARCIAL', 'PAGADO')
    `);

    // Enum para método de pago
    await queryRunner.query(`
      CREATE TYPE "public"."metodo_pago_enum" AS ENUM('EFECTIVO', 'QR', 'TARJETA', 'TRANSFERENCIA')
    `);

    // ========================================
    // 2. CREAR TABLA TERCERO
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "tercero" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying(200) NOT NULL,
        "tipo" "public"."tipo_tercero_enum" NOT NULL,
        "saldo_actual" decimal(12,2) NOT NULL DEFAULT 0,
        "empresa_id" uuid NOT NULL,
        "eliminado" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tercero" PRIMARY KEY ("id")
      )
    `);

    // Índices para tercero
    await queryRunner.query(`
      CREATE INDEX "IDX_tercero_empresa_id" ON "tercero" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tercero_empresa_eliminado" ON "tercero" ("empresa_id", "eliminado")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tercero_empresa_tipo" ON "tercero" ("empresa_id", "tipo")
    `);

    // Foreign key de tercero a empresa
    await queryRunner.query(`
      ALTER TABLE "tercero"
      ADD CONSTRAINT "FK_tercero_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // ========================================
    // 3. CREAR TABLA COMPROBANTE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "comprobante" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tipo" "public"."tipo_comprobante_enum" NOT NULL,
        "total" decimal(12,2) NOT NULL,
        "saldo_pendiente" decimal(12,2) NOT NULL,
        "estado_pago" "public"."estado_pago_enum" NOT NULL DEFAULT 'PENDIENTE',
        "tercero_id" uuid,
        "empresa_id" uuid NOT NULL,
        "eliminado" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comprobante" PRIMARY KEY ("id")
      )
    `);

    // Índices para comprobante
    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_empresa_id" ON "comprobante" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_empresa_tipo" ON "comprobante" ("empresa_id", "tipo")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_empresa_estado_pago" ON "comprobante" ("empresa_id", "estado_pago")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_tercero_id" ON "comprobante" ("tercero_id")
    `);

    // Foreign key de comprobante a tercero (SET NULL porque puede ser venta anónima)
    await queryRunner.query(`
      ALTER TABLE "comprobante"
      ADD CONSTRAINT "FK_comprobante_tercero"
      FOREIGN KEY ("tercero_id")
      REFERENCES "tercero"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Foreign key de comprobante a empresa
    await queryRunner.query(`
      ALTER TABLE "comprobante"
      ADD CONSTRAINT "FK_comprobante_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // ========================================
    // 4. CREAR TABLA COMPROBANTE_DETALLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "comprobante_detalle" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "comprobante_id" uuid NOT NULL,
        "producto_id" uuid NOT NULL,
        "nombre_producto" character varying(200) NOT NULL,
        "cantidad" integer NOT NULL,
        "precio_unitario" decimal(12,2) NOT NULL,
        "subtotal" decimal(12,2) NOT NULL,
        "empresa_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comprobante_detalle" PRIMARY KEY ("id")
      )
    `);

    // Índices para comprobante_detalle
    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_detalle_empresa_id" ON "comprobante_detalle" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_detalle_comprobante_id" ON "comprobante_detalle" ("comprobante_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_detalle_producto_id" ON "comprobante_detalle" ("producto_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comprobante_detalle_empresa_producto" ON "comprobante_detalle" ("empresa_id", "producto_id")
    `);

    // Foreign key de comprobante_detalle a comprobante (CASCADE)
    await queryRunner.query(`
      ALTER TABLE "comprobante_detalle"
      ADD CONSTRAINT "FK_comprobante_detalle_comprobante"
      FOREIGN KEY ("comprobante_id")
      REFERENCES "comprobante"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Foreign key de comprobante_detalle a producto (RESTRICT)
    await queryRunner.query(`
      ALTER TABLE "comprobante_detalle"
      ADD CONSTRAINT "FK_comprobante_detalle_producto"
      FOREIGN KEY ("producto_id")
      REFERENCES "producto"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    // Foreign key de comprobante_detalle a empresa
    await queryRunner.query(`
      ALTER TABLE "comprobante_detalle"
      ADD CONSTRAINT "FK_comprobante_detalle_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // ========================================
    // 5. CREAR TABLA COBRO
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "cobro" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "monto" decimal(12,2) NOT NULL,
        "fecha" TIMESTAMP NOT NULL,
        "metodo" "public"."metodo_pago_enum" NOT NULL,
        "comprobante_id" uuid NOT NULL,
        "empresa_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cobro" PRIMARY KEY ("id")
      )
    `);

    // Índices para cobro
    await queryRunner.query(`
      CREATE INDEX "IDX_cobro_empresa_id" ON "cobro" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cobro_comprobante_id" ON "cobro" ("comprobante_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cobro_empresa_fecha" ON "cobro" ("empresa_id", "fecha")
    `);

    // Foreign key de cobro a comprobante (CASCADE)
    await queryRunner.query(`
      ALTER TABLE "cobro"
      ADD CONSTRAINT "FK_cobro_comprobante"
      FOREIGN KEY ("comprobante_id")
      REFERENCES "comprobante"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Foreign key de cobro a empresa
    await queryRunner.query(`
      ALTER TABLE "cobro"
      ADD CONSTRAINT "FK_cobro_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // ========================================
    // 6. COMENTARIOS EN LAS TABLAS
    // ========================================
    await queryRunner.query(`
      COMMENT ON TABLE "tercero" IS 'Clientes y proveedores del sistema'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "tercero"."saldo_actual" IS 'Caché del saldo actual del tercero (deuda o crédito)'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "comprobante" IS 'Ventas y cotizaciones del sistema'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "comprobante"."saldo_pendiente" IS 'Saldo que falta pagar del comprobante'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "comprobante_detalle" IS 'Items individuales de cada venta'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "comprobante_detalle"."nombre_producto" IS 'Denormalizado para mantener historial inmutable'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "cobro" IS 'Movimientos de dinero (pagos) asociados a comprobantes'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. DROP FOREIGN KEYS
    // ========================================
    await queryRunner.query(`
      ALTER TABLE "cobro" DROP CONSTRAINT "FK_cobro_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "cobro" DROP CONSTRAINT "FK_cobro_comprobante"
    `);

    await queryRunner.query(`
      ALTER TABLE "comprobante_detalle" DROP CONSTRAINT "FK_comprobante_detalle_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "comprobante_detalle" DROP CONSTRAINT "FK_comprobante_detalle_producto"
    `);

    await queryRunner.query(`
      ALTER TABLE "comprobante_detalle" DROP CONSTRAINT "FK_comprobante_detalle_comprobante"
    `);

    await queryRunner.query(`
      ALTER TABLE "comprobante" DROP CONSTRAINT "FK_comprobante_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "comprobante" DROP CONSTRAINT "FK_comprobante_tercero"
    `);

    await queryRunner.query(`
      ALTER TABLE "tercero" DROP CONSTRAINT "FK_tercero_empresa"
    `);

    // ========================================
    // 2. DROP ÍNDICES
    // ========================================
    // Índices de cobro
    await queryRunner.query(`DROP INDEX "public"."IDX_cobro_empresa_fecha"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cobro_comprobante_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cobro_empresa_id"`);

    // Índices de comprobante_detalle
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comprobante_detalle_empresa_producto"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comprobante_detalle_producto_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comprobante_detalle_comprobante_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comprobante_detalle_empresa_id"`,
    );

    // Índices de comprobante
    await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_tercero_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comprobante_empresa_estado_pago"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comprobante_empresa_tipo"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_empresa_id"`);

    // Índices de tercero
    await queryRunner.query(`DROP INDEX "public"."IDX_tercero_empresa_tipo"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tercero_empresa_eliminado"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_tercero_empresa_id"`);

    // ========================================
    // 3. DROP TABLAS
    // ========================================
    await queryRunner.query(`DROP TABLE "cobro"`);
    await queryRunner.query(`DROP TABLE "comprobante_detalle"`);
    await queryRunner.query(`DROP TABLE "comprobante"`);
    await queryRunner.query(`DROP TABLE "tercero"`);

    // ========================================
    // 4. DROP ENUMS
    // ========================================
    await queryRunner.query(`DROP TYPE "public"."metodo_pago_enum"`);
    await queryRunner.query(`DROP TYPE "public"."estado_pago_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tipo_comprobante_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tipo_tercero_enum"`);
  }
}
