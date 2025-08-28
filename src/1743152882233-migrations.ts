import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1743152882233 implements MigrationInterface {
    name = 'Migrations1743152882233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "chat"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "is_read"`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "message" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "timestamp" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "PK_9d0b2ba74336710fd31154738a5"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "chat" ALTER COLUMN "receiver" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" ALTER COLUMN "receiver" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "PK_9d0b2ba74336710fd31154738a5"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "timestamp"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "is_read" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "chat" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
