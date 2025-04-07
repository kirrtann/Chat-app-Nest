import { MigrationInterface, QueryRunner } from "typeorm";

export class Chat1744007140764 implements MigrationInterface {
    name = 'Chat1744007140764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "sender" character varying NOT NULL, "room" character varying NOT NULL, "message" text NOT NULL, "receiver" character varying, CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "chat"`);
    }

}
