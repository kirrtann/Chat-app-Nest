import { MigrationInterface, QueryRunner } from "typeorm";

export class Chat1743135044124 implements MigrationInterface {
    name = 'Chat1743135044124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "chat" character varying NOT NULL, "sender" character varying NOT NULL, "receiver" character varying NOT NULL, "room" character varying NOT NULL, "is_read" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."otp_type_enum" RENAME TO "otp_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."otp_type_enum" AS ENUM('sign_up', 'forgot_password')`);
        await queryRunner.query(`ALTER TABLE "otp" ALTER COLUMN "type" TYPE "public"."otp_type_enum" USING "type"::"text"::"public"."otp_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."otp_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."otp_type_enum_old" AS ENUM('sign_up', 'login_in', 'forgot_password')`);
        await queryRunner.query(`ALTER TABLE "otp" ALTER COLUMN "type" TYPE "public"."otp_type_enum_old" USING "type"::"text"::"public"."otp_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."otp_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."otp_type_enum_old" RENAME TO "otp_type_enum"`);
        await queryRunner.query(`DROP TABLE "chat"`);
    }

}
