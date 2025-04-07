import { MigrationInterface, QueryRunner } from "typeorm";

export class Contact1744007571137 implements MigrationInterface {
    name = 'Contact1744007571137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."contact_status_enum" AS ENUM('pending', 'active', 'blocked')`);
        await queryRunner.query(`CREATE TABLE "contact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "contact_email" character varying NOT NULL, "contact_name" character varying NOT NULL, "status" "public"."contact_status_enum" NOT NULL DEFAULT 'pending', "user_id" uuid, CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contact" ADD CONSTRAINT "FK_33d4fc93803e7192e150216fffb" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact" DROP CONSTRAINT "FK_33d4fc93803e7192e150216fffb"`);
        await queryRunner.query(`DROP TABLE "contact"`);
        await queryRunner.query(`DROP TYPE "public"."contact_status_enum"`);
    }

}
