import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1744099538970 implements MigrationInterface {
  name = 'Migrations1744099538970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contact" ADD "room" uuid`);
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "FK_2114257ac1a16d594424d5d7a38" FOREIGN KEY ("room") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "FK_2114257ac1a16d594424d5d7a38"`,
    );
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "room"`);
  }
}
