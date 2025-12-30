import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1731606000000 implements MigrationInterface {
  name = 'InitialSchema1731606000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    // Create empresa table
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

    // Create usuario table
    await queryRunner.query(`
      CREATE TYPE "public"."usuario_rol_enum" AS ENUM('DUEÑO', 'EMPLEADO')
    `);

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

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_usuario_empresa_id" ON "usuario" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_usuario_empresa_email" ON "usuario" ("empresa_id", "email")
    `);

    // Create foreign key
    await queryRunner.query(`
      ALTER TABLE "usuario"
      ADD CONSTRAINT "FK_usuario_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresa"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE "usuario" DROP CONSTRAINT "FK_usuario_empresa"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "public"."IDX_usuario_empresa_email"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_usuario_empresa_id"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "usuario"`);
    await queryRunner.query(`DROP TYPE "public"."usuario_rol_enum"`);
    await queryRunner.query(`DROP TABLE "empresa"`);
  }
}
