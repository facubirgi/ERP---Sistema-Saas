import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConvertidaAVentaToComprobante1735078800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "comprobante"
      ADD COLUMN "convertida_a_venta" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "comprobante"
      DROP COLUMN "convertida_a_venta"
    `);
  }
}
