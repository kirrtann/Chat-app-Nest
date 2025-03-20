import { MigrationInterface, QueryRunner } from "typeorm";

export class Usertoken1742452318490 implements MigrationInterface {
    name = 'Usertoken1742452318490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "fk_user" uuid, CONSTRAINT "PK_48cb6b5c20faa63157b3c1baf7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_token" ADD CONSTRAINT "FK_142a69ff7ddb36fee20c3c30351" FOREIGN KEY ("fk_user") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_token" DROP CONSTRAINT "FK_142a69ff7ddb36fee20c3c30351"`);
        await queryRunner.query(`DROP TABLE "user_token"`);
    }

}
