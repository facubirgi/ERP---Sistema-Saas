import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsuarioIdToComprobante1739200000000 implements MigrationInterface {
    name = 'AddUsuarioIdToComprobante1739200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Agregar columna usuario_id a comprobante
        await queryRunner.query(`
            ALTER TABLE "comprobante"
            ADD "usuario_id" uuid
        `);

        // 2. Crear FK: Comprobante -> Usuario (SET NULL)
        await queryRunner.query(`
            ALTER TABLE "comprobante"
            ADD CONSTRAINT "FK_comprobante_usuario"
            FOREIGN KEY ("usuario_id")
            REFERENCES "usuario"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // 3. Crear índice para búsquedas por usuario
        await queryRunner.query(`CREATE INDEX "IDX_comprobante_usuario_id" ON "comprobante" ("usuario_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_comprobante_usuario_id"`);
        await queryRunner.query(`ALTER TABLE "comprobante" DROP CONSTRAINT "FK_comprobante_usuario"`);
        await queryRunner.query(`ALTER TABLE "comprobante" DROP COLUMN "usuario_id"`);
    }
}
