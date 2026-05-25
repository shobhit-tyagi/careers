import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779701804517 implements MigrationInterface {
    name = 'Init1779701804517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "leaderboard" ("userId" uuid NOT NULL, "displayName" character varying NOT NULL, "points" integer NOT NULL, "rank" integer NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a77cb06009c75ceb055b231e120" PRIMARY KEY ("userId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "leaderboard"`);
    }

}
