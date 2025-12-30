import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCajaModule1732656000000 implements MigrationInterface {
  name = 'CreateCajaModule1732656000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. CREAR ENUMS
    // ========================================

    // Enum para estado de caja
    await queryRunner.query(`
      CREATE TYPE "public"."estado_caja_enum" AS ENUM('ABIERTA', 'CERRADA')
    `);

    // Enum para tipo de movimiento
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_movimiento_enum" AS ENUM('INGRESO', 'EGRESO')
    `);

    // Enum para origen del movimiento
    await queryRunner.query(`
      CREATE TYPE "public"."origen_movimiento_enum" AS ENUM('APERTURA', 'VENTA', 'GASTO', 'RETIRO', 'DEPOSITO', 'DEVOLUCION', 'AJUSTE')
    `);

    // Enum para método de pago en caja
    await queryRunner.query(`
      CREATE TYPE "public"."metodo_pago_caja_enum" AS ENUM('EFECTIVO', 'QR', 'TRANSFERENCIA', 'OTRO')
    `);

    // ========================================
    // 2. CREAR TABLA CAJA_SESION
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "caja_sesion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fecha_apertura" TIMESTAMP NOT NULL,
        "fecha_cierre" TIMESTAMP,
        "monto_inicial" decimal(12,2) NOT NULL,
        "monto_final_sistema" decimal(12,2),
        "monto_final_real" decimal(12,2),
        "diferencia" decimal(12,2),
        "estado" "public"."estado_caja_enum" NOT NULL DEFAULT 'ABIERTA',
        "usuario_id" uuid NOT NULL,
        "empresa_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caja_sesion" PRIMARY KEY ("id")
      )
    `);

    // Índices para caja_sesion
    await queryRunner.query(`
      CREATE INDEX "IDX_caja_sesion_empresa_id" ON "caja_sesion" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_caja_sesion_empresa_estado" ON "caja_sesion" ("empresa_id", "estado")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_caja_sesion_empresa_fecha_apertura" ON "caja_sesion" ("empresa_id", "fecha_apertura")
    `);

    // Foreign key de caja_sesion a usuario (SET NULL si se elimina el usuario)
    await queryRunner.query(`
      ALTER TABLE "caja_sesion"
      ADD CONSTRAINT "FK_caja_sesion_usuario"
      FOREIGN KEY ("usuario_id")
      REFERENCES "usuario"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // Foreign key de caja_sesion a empresa
    await queryRunner.query(`
      ALTER TABLE "caja_sesion"
      ADD CONSTRAINT "FK_caja_sesion_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // ========================================
    // 3. CREAR TABLA MOVIMIENTO_CAJA
    // ========================================
    await queryRunner.query(`
      CREATE TABLE "movimiento_caja" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sesion_id" uuid NOT NULL,
        "fecha" TIMESTAMP NOT NULL,
        "monto" decimal(12,2) NOT NULL,
        "tipo" "public"."tipo_movimiento_enum" NOT NULL,
        "origen" "public"."origen_movimiento_enum" NOT NULL,
        "metodo_pago" "public"."metodo_pago_caja_enum" NOT NULL,
        "descripcion" character varying(500) NOT NULL,
        "empresa_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_movimiento_caja" PRIMARY KEY ("id")
      )
    `);

    // Índices para movimiento_caja
    await queryRunner.query(`
      CREATE INDEX "IDX_movimiento_caja_empresa_id" ON "movimiento_caja" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_movimiento_caja_sesion_id" ON "movimiento_caja" ("sesion_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_movimiento_caja_empresa_fecha" ON "movimiento_caja" ("empresa_id", "fecha")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_movimiento_caja_empresa_tipo" ON "movimiento_caja" ("empresa_id", "tipo")
    `);

    // Foreign key de movimiento_caja a caja_sesion (CASCADE porque si se elimina la sesión, se eliminan sus movimientos)
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      ADD CONSTRAINT "FK_movimiento_caja_sesion"
      FOREIGN KEY ("sesion_id")
      REFERENCES "caja_sesion"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Foreign key de movimiento_caja a empresa
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja"
      ADD CONSTRAINT "FK_movimiento_caja_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // ROLLBACK: ELIMINAR TABLAS Y ENUMS
    // ========================================

    // 1. Eliminar foreign keys
    await queryRunner.query(`
      ALTER TABLE "movimiento_caja" DROP CONSTRAINT "FK_movimiento_caja_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "movimiento_caja" DROP CONSTRAINT "FK_movimiento_caja_sesion"
    `);

    await queryRunner.query(`
      ALTER TABLE "caja_sesion" DROP CONSTRAINT "FK_caja_sesion_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "caja_sesion" DROP CONSTRAINT "FK_caja_sesion_usuario"
    `);

    // 2. Eliminar índices (se eliminan automáticamente al eliminar tablas)

    // 3. Eliminar tablas
    await queryRunner.query(`DROP TABLE "movimiento_caja"`);
    await queryRunner.query(`DROP TABLE "caja_sesion"`);

    // 4. Eliminar enums
    await queryRunner.query(`DROP TYPE "public"."metodo_pago_caja_enum"`);
    await queryRunner.query(`DROP TYPE "public"."origen_movimiento_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tipo_movimiento_enum"`);
    await queryRunner.query(`DROP TYPE "public"."estado_caja_enum"`);
  }
}
