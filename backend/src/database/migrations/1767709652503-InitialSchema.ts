import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1767709652503 implements MigrationInterface {
    name = 'InitialSchema1767709652503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Habilitar extensión UUID
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // 2. Crear ENUMs
        await queryRunner.query(`CREATE TYPE "public"."usuario_rol_enum" AS ENUM('DUEÑO', 'EMPLEADO')`);
        await queryRunner.query(`CREATE TYPE "public"."tercero_tipo_enum" AS ENUM('CLIENTE', 'PROVEEDOR')`);
        await queryRunner.query(`CREATE TYPE "public"."comprobante_tipo_enum" AS ENUM('VENTA', 'COTIZACION')`);
        await queryRunner.query(`CREATE TYPE "public"."comprobante_estado_pago_enum" AS ENUM('PENDIENTE', 'PARCIAL', 'PAGADO')`);
        await queryRunner.query(`CREATE TYPE "public"."cobro_metodo_enum" AS ENUM('EFECTIVO', 'QR', 'TARJETA', 'TRANSFERENCIA')`);
        await queryRunner.query(`CREATE TYPE "public"."caja_sesion_estado_enum" AS ENUM('ABIERTA', 'CERRADA')`);
        await queryRunner.query(`CREATE TYPE "public"."movimiento_caja_tipo_enum" AS ENUM('INGRESO', 'EGRESO')`);
        await queryRunner.query(`CREATE TYPE "public"."movimiento_caja_origen_enum" AS ENUM('APERTURA', 'VENTA', 'GASTO', 'RETIRO', 'DEPOSITO', 'DEVOLUCION', 'AJUSTE')`);
        await queryRunner.query(`CREATE TYPE "public"."movimiento_caja_metodo_pago_enum" AS ENUM('EFECTIVO', 'QR', 'TRANSFERENCIA', 'OTRO')`);

        // 3. Crear tabla EMPRESA
        await queryRunner.query(`
            CREATE TABLE "empresa" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "razon_social" character varying(255) NOT NULL,
                "cuit" character varying(20),
                "email" character varying(255) NOT NULL,
                "telefono" character varying(50),
                "direccion" text,
                "activo" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_empresa_cuit" UNIQUE ("cuit"),
                CONSTRAINT "UQ_empresa_email" UNIQUE ("email"),
                CONSTRAINT "PK_empresa" PRIMARY KEY ("id")
            )
        `);

        // 4. Crear tabla USUARIO
        await queryRunner.query(`
            CREATE TABLE "usuario" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "empresa_id" uuid NOT NULL,
                "nombre" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "rol" "public"."usuario_rol_enum" NOT NULL DEFAULT 'EMPLEADO',
                "activo" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_usuario" PRIMARY KEY ("id")
            )
        `);

        // 5. Crear tabla CATEGORIA
        await queryRunner.query(`
            CREATE TABLE "categoria" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nombre" character varying(100) NOT NULL,
                "empresa_id" uuid NOT NULL,
                "eliminado" boolean NOT NULL DEFAULT false,
                "deleted_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_categoria" PRIMARY KEY ("id")
            )
        `);

        // 6. Crear tabla PRODUCTO
        await queryRunner.query(`
            CREATE TABLE "producto" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "codigo_barras" character varying(50),
                "nombre" character varying(200) NOT NULL,
                "precio_costo" numeric(10,2) NOT NULL,
                "precio_venta" numeric(10,2) NOT NULL,
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

        // 7. Crear tabla TERCERO
        await queryRunner.query(`
            CREATE TABLE "tercero" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nombre" character varying(200) NOT NULL,
                "direccion" character varying(300),
                "tipo" "public"."tercero_tipo_enum" NOT NULL,
                "saldo_actual" numeric(12,2) NOT NULL DEFAULT '0',
                "empresa_id" uuid NOT NULL,
                "eliminado" boolean NOT NULL DEFAULT false,
                "deleted_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tercero" PRIMARY KEY ("id")
            )
        `);

        // 8. Crear tabla COMPROBANTE
        await queryRunner.query(`
            CREATE TABLE "comprobante" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tipo" "public"."comprobante_tipo_enum" NOT NULL,
                "numero_comprobante" character varying(50),
                "fecha_vencimiento" TIMESTAMP,
                "usuario_emisor" character varying(200),
                "convertida_a_venta" boolean NOT NULL DEFAULT false,
                "total" numeric(12,2) NOT NULL,
                "saldo_pendiente" numeric(12,2) NOT NULL,
                "estado_pago" "public"."comprobante_estado_pago_enum" NOT NULL DEFAULT 'PENDIENTE',
                "tercero_id" uuid,
                "cliente_nombre" character varying(200),
                "empresa_id" uuid NOT NULL,
                "eliminado" boolean NOT NULL DEFAULT false,
                "deleted_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_comprobante" PRIMARY KEY ("id")
            )
        `);

        // 9. Crear tabla COMPROBANTE_DETALLE
        await queryRunner.query(`
            CREATE TABLE "comprobante_detalle" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "comprobante_id" uuid NOT NULL,
                "producto_id" uuid NOT NULL,
                "nombre_producto" character varying(200) NOT NULL,
                "cantidad" integer NOT NULL,
                "precio_unitario" numeric(12,2) NOT NULL,
                "subtotal" numeric(12,2) NOT NULL,
                "empresa_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_comprobante_detalle" PRIMARY KEY ("id")
            )
        `);

        // 10. Crear tabla COBRO
        await queryRunner.query(`
            CREATE TABLE "cobro" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "monto" numeric(12,2) NOT NULL,
                "fecha" TIMESTAMP NOT NULL,
                "metodo" "public"."cobro_metodo_enum" NOT NULL,
                "comprobante_id" uuid NOT NULL,
                "empresa_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cobro" PRIMARY KEY ("id")
            )
        `);

        // 11. Crear tabla CAJA_SESION
        await queryRunner.query(`
            CREATE TABLE "caja_sesion" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fecha_apertura" TIMESTAMP NOT NULL,
                "fecha_cierre" TIMESTAMP,
                "monto_inicial" numeric(12,2) NOT NULL,
                "monto_final_sistema" numeric(12,2),
                "monto_final_real" numeric(12,2),
                "diferencia" numeric(12,2),
                "estado" "public"."caja_sesion_estado_enum" NOT NULL DEFAULT 'ABIERTA',
                "usuario_id" uuid NOT NULL,
                "empresa_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_caja_sesion" PRIMARY KEY ("id")
            )
        `);

        // 12. Crear tabla MOVIMIENTO_CAJA
        await queryRunner.query(`
            CREATE TABLE "movimiento_caja" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sesion_id" uuid NOT NULL,
                "fecha" TIMESTAMP NOT NULL,
                "monto" numeric(12,2) NOT NULL,
                "tipo" "public"."movimiento_caja_tipo_enum" NOT NULL,
                "origen" "public"."movimiento_caja_origen_enum" NOT NULL,
                "metodo_pago" "public"."movimiento_caja_metodo_pago_enum" NOT NULL,
                "descripcion" character varying(500) NOT NULL,
                "empresa_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_movimiento_caja" PRIMARY KEY ("id")
            )
        `);

        // 13. Crear FOREIGN KEYS

        // Usuario -> Empresa
        await queryRunner.query(`
            ALTER TABLE "usuario"
            ADD CONSTRAINT "FK_usuario_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Categoria -> Empresa
        await queryRunner.query(`
            ALTER TABLE "categoria"
            ADD CONSTRAINT "FK_categoria_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Producto -> Categoria
        await queryRunner.query(`
            ALTER TABLE "producto"
            ADD CONSTRAINT "FK_producto_categoria"
            FOREIGN KEY ("categoria_id")
            REFERENCES "categoria"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION
        `);

        // Producto -> Empresa
        await queryRunner.query(`
            ALTER TABLE "producto"
            ADD CONSTRAINT "FK_producto_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Tercero -> Empresa
        await queryRunner.query(`
            ALTER TABLE "tercero"
            ADD CONSTRAINT "FK_tercero_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Comprobante -> Tercero (SET NULL)
        await queryRunner.query(`
            ALTER TABLE "comprobante"
            ADD CONSTRAINT "FK_comprobante_tercero"
            FOREIGN KEY ("tercero_id")
            REFERENCES "tercero"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Comprobante -> Empresa
        await queryRunner.query(`
            ALTER TABLE "comprobante"
            ADD CONSTRAINT "FK_comprobante_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // ComprobanteDetalle -> Comprobante
        await queryRunner.query(`
            ALTER TABLE "comprobante_detalle"
            ADD CONSTRAINT "FK_comprobante_detalle_comprobante"
            FOREIGN KEY ("comprobante_id")
            REFERENCES "comprobante"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // ComprobanteDetalle -> Producto
        await queryRunner.query(`
            ALTER TABLE "comprobante_detalle"
            ADD CONSTRAINT "FK_comprobante_detalle_producto"
            FOREIGN KEY ("producto_id")
            REFERENCES "producto"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION
        `);

        // ComprobanteDetalle -> Empresa
        await queryRunner.query(`
            ALTER TABLE "comprobante_detalle"
            ADD CONSTRAINT "FK_comprobante_detalle_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Cobro -> Comprobante
        await queryRunner.query(`
            ALTER TABLE "cobro"
            ADD CONSTRAINT "FK_cobro_comprobante"
            FOREIGN KEY ("comprobante_id")
            REFERENCES "comprobante"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Cobro -> Empresa
        await queryRunner.query(`
            ALTER TABLE "cobro"
            ADD CONSTRAINT "FK_cobro_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // CajaSesion -> Usuario (SET NULL)
        await queryRunner.query(`
            ALTER TABLE "caja_sesion"
            ADD CONSTRAINT "FK_caja_sesion_usuario"
            FOREIGN KEY ("usuario_id")
            REFERENCES "usuario"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // CajaSesion -> Empresa
        await queryRunner.query(`
            ALTER TABLE "caja_sesion"
            ADD CONSTRAINT "FK_caja_sesion_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // MovimientoCaja -> CajaSesion
        await queryRunner.query(`
            ALTER TABLE "movimiento_caja"
            ADD CONSTRAINT "FK_movimiento_caja_sesion"
            FOREIGN KEY ("sesion_id")
            REFERENCES "caja_sesion"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // MovimientoCaja -> Empresa
        await queryRunner.query(`
            ALTER TABLE "movimiento_caja"
            ADD CONSTRAINT "FK_movimiento_caja_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresa"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // 14. Crear ÍNDICES

        // Usuario
        await queryRunner.query(`CREATE INDEX "IDX_usuario_empresa_id" ON "usuario" ("empresa_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_usuario_empresa_email" ON "usuario" ("empresa_id", "email") `);

        // Categoria
        await queryRunner.query(`CREATE INDEX "IDX_categoria_empresa_id" ON "categoria" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_categoria_empresa_eliminado" ON "categoria" ("empresa_id", "eliminado") `);

        // Producto
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_producto_empresa_codigo_barras"
            ON "producto" ("empresa_id", "codigo_barras")
            WHERE codigo_barras IS NOT NULL
        `);
        await queryRunner.query(`CREATE INDEX "IDX_producto_empresa_id" ON "producto" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_producto_empresa_categoria" ON "producto" ("empresa_id", "categoria_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_producto_empresa_nombre" ON "producto" ("empresa_id", "nombre") `);
        await queryRunner.query(`CREATE INDEX "IDX_producto_empresa_stock" ON "producto" ("empresa_id", "stock_actual") `);
        await queryRunner.query(`CREATE INDEX "IDX_producto_empresa_eliminado" ON "producto" ("empresa_id", "eliminado") `);

        // Tercero
        await queryRunner.query(`CREATE INDEX "IDX_tercero_empresa_id" ON "tercero" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tercero_empresa_eliminado" ON "tercero" ("empresa_id", "eliminado") `);
        await queryRunner.query(`CREATE INDEX "IDX_tercero_empresa_tipo" ON "tercero" ("empresa_id", "tipo") `);

        // Comprobante
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_empresa_id" ON "comprobante" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_empresa_tipo" ON "comprobante" ("empresa_id", "tipo") `);
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_empresa_estado_pago" ON "comprobante" ("empresa_id", "estado_pago") `);
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_tercero_id" ON "comprobante" ("tercero_id") `);

        // ComprobanteDetalle
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_detalle_empresa_id" ON "comprobante_detalle" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_detalle_comprobante" ON "comprobante_detalle" ("comprobante_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_detalle_producto" ON "comprobante_detalle" ("producto_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_detalle_empresa_producto" ON "comprobante_detalle" ("empresa_id", "producto_id") `);

        // Cobro
        await queryRunner.query(`CREATE INDEX "IDX_cobro_empresa_id" ON "cobro" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cobro_comprobante" ON "cobro" ("comprobante_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cobro_empresa_fecha" ON "cobro" ("empresa_id", "fecha") `);

        // CajaSesion
        await queryRunner.query(`CREATE INDEX "IDX_caja_sesion_empresa_id" ON "caja_sesion" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_caja_sesion_empresa_estado" ON "caja_sesion" ("empresa_id", "estado") `);
        await queryRunner.query(`CREATE INDEX "IDX_caja_sesion_empresa_fecha_apertura" ON "caja_sesion" ("empresa_id", "fecha_apertura") `);

        // MovimientoCaja
        await queryRunner.query(`CREATE INDEX "IDX_movimiento_caja_empresa_id" ON "movimiento_caja" ("empresa_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_movimiento_caja_sesion" ON "movimiento_caja" ("sesion_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_movimiento_caja_empresa_fecha" ON "movimiento_caja" ("empresa_id", "fecha") `);
        await queryRunner.query(`CREATE INDEX "IDX_movimiento_caja_empresa_tipo" ON "movimiento_caja" ("empresa_id", "tipo") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar en orden inverso: índices -> FKs -> tablas -> ENUMs

        // 1. Eliminar índices
        await queryRunner.query(`DROP INDEX "public"."IDX_movimiento_caja_empresa_tipo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_movimiento_caja_empresa_fecha"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_movimiento_caja_sesion"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_movimiento_caja_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_caja_sesion_empresa_fecha_apertura"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_caja_sesion_empresa_estado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_caja_sesion_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cobro_empresa_fecha"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cobro_comprobante"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cobro_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_detalle_empresa_producto"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_detalle_producto"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_detalle_comprobante"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_detalle_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_tercero_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_empresa_estado_pago"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_empresa_tipo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tercero_empresa_tipo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tercero_empresa_eliminado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tercero_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_eliminado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_stock"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_nombre"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_categoria"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_producto_empresa_codigo_barras"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_categoria_empresa_eliminado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_categoria_empresa_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_usuario_empresa_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_usuario_empresa_id"`);

        // 2. Eliminar Foreign Keys
        await queryRunner.query(`ALTER TABLE "movimiento_caja" DROP CONSTRAINT "FK_movimiento_caja_empresa"`);
        await queryRunner.query(`ALTER TABLE "movimiento_caja" DROP CONSTRAINT "FK_movimiento_caja_sesion"`);
        await queryRunner.query(`ALTER TABLE "caja_sesion" DROP CONSTRAINT "FK_caja_sesion_empresa"`);
        await queryRunner.query(`ALTER TABLE "caja_sesion" DROP CONSTRAINT "FK_caja_sesion_usuario"`);
        await queryRunner.query(`ALTER TABLE "cobro" DROP CONSTRAINT "FK_cobro_empresa"`);
        await queryRunner.query(`ALTER TABLE "cobro" DROP CONSTRAINT "FK_cobro_comprobante"`);
        await queryRunner.query(`ALTER TABLE "comprobante_detalle" DROP CONSTRAINT "FK_comprobante_detalle_empresa"`);
        await queryRunner.query(`ALTER TABLE "comprobante_detalle" DROP CONSTRAINT "FK_comprobante_detalle_producto"`);
        await queryRunner.query(`ALTER TABLE "comprobante_detalle" DROP CONSTRAINT "FK_comprobante_detalle_comprobante"`);
        await queryRunner.query(`ALTER TABLE "comprobante" DROP CONSTRAINT "FK_comprobante_empresa"`);
        await queryRunner.query(`ALTER TABLE "comprobante" DROP CONSTRAINT "FK_comprobante_tercero"`);
        await queryRunner.query(`ALTER TABLE "tercero" DROP CONSTRAINT "FK_tercero_empresa"`);
        await queryRunner.query(`ALTER TABLE "producto" DROP CONSTRAINT "FK_producto_empresa"`);
        await queryRunner.query(`ALTER TABLE "producto" DROP CONSTRAINT "FK_producto_categoria"`);
        await queryRunner.query(`ALTER TABLE "categoria" DROP CONSTRAINT "FK_categoria_empresa"`);
        await queryRunner.query(`ALTER TABLE "usuario" DROP CONSTRAINT "FK_usuario_empresa"`);

        // 3. Eliminar tablas
        await queryRunner.query(`DROP TABLE "movimiento_caja"`);
        await queryRunner.query(`DROP TABLE "caja_sesion"`);
        await queryRunner.query(`DROP TABLE "cobro"`);
        await queryRunner.query(`DROP TABLE "comprobante_detalle"`);
        await queryRunner.query(`DROP TABLE "comprobante"`);
        await queryRunner.query(`DROP TABLE "tercero"`);
        await queryRunner.query(`DROP TABLE "producto"`);
        await queryRunner.query(`DROP TABLE "categoria"`);
        await queryRunner.query(`DROP TABLE "usuario"`);
        await queryRunner.query(`DROP TABLE "empresa"`);

        // 4. Eliminar ENUMs
        await queryRunner.query(`DROP TYPE "public"."movimiento_caja_metodo_pago_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movimiento_caja_origen_enum"`);
        await queryRunner.query(`DROP TYPE "public"."movimiento_caja_tipo_enum"`);
        await queryRunner.query(`DROP TYPE "public"."caja_sesion_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cobro_metodo_enum"`);
        await queryRunner.query(`DROP TYPE "public"."comprobante_estado_pago_enum"`);
        await queryRunner.query(`DROP TYPE "public"."comprobante_tipo_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tercero_tipo_enum"`);
        await queryRunner.query(`DROP TYPE "public"."usuario_rol_enum"`);
    }
}
