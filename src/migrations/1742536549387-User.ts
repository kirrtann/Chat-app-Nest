import { MigrationInterface, QueryRunner } from "typeorm";

export class User1742536549387 implements MigrationInterface {
    name = 'User1742536549387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."otp_type_enum" AS ENUM('sign_up', 'login_in', 'forgot_password')`);
        await queryRunner.query(`CREATE TABLE "otp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "otp" integer NOT NULL, "email" character varying NOT NULL, "type" "public"."otp_type_enum" NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "expire_at" integer NOT NULL, "user_id" uuid, CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "is_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "otp" ADD CONSTRAINT "FK_258d028d322ea3b856bf9f12f25" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp" DROP CONSTRAINT "FK_258d028d322ea3b856bf9f12f25"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_verified"`);
        await queryRunner.query(`DROP TABLE "otp"`);
        await queryRunner.query(`DROP TYPE "public"."otp_type_enum"`);
    }

}
