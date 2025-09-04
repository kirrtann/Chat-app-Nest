import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1743134031711 implements MigrationInterface {
  name = 'Migrations1743134031711';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."otp_type_enum" RENAME TO "otp_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."otp_type_enum" AS ENUM('sign_up', 'forgot_password')`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp" ALTER COLUMN "type" TYPE "public"."otp_type_enum" USING "type"::"text"::"public"."otp_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."otp_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."otp_type_enum_old" AS ENUM('sign_up', 'login_in', 'forgot_password')`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp" ALTER COLUMN "type" TYPE "public"."otp_type_enum_old" USING "type"::"text"::"public"."otp_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."otp_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."otp_type_enum_old" RENAME TO "otp_type_enum"`,
    );
  }
}
