import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsuarioIdToTercero1740000000000 implements MigrationInterface {
  name = 'AddUsuarioIdToTercero1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tercero" ADD "usuario_id" uuid`);

    await queryRunner.query(`
      ALTER TABLE "tercero"
      ADD CONSTRAINT "FK_tercero_usuario"
      FOREIGN KEY ("usuario_id")
      REFERENCES "usuario"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_tercero_usuario_id" ON "tercero" ("usuario_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tercero_usuario_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tercero" DROP CONSTRAINT "FK_tercero_usuario"`,
    );
    await queryRunner.query(`ALTER TABLE "tercero" DROP COLUMN "usuario_id"`);
  }
}
