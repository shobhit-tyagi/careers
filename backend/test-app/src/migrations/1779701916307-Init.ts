import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779701916307 implements MigrationInterface {
    name = 'Init1779701916307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP CONSTRAINT "PK_a77cb06009c75ceb055b231e120"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP COLUMN "displayName"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD CONSTRAINT "PK_f8c0444d594f510f473a6392e4d" PRIMARY KEY ("user_id")`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD "display_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP COLUMN "display_name"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP CONSTRAINT "PK_f8c0444d594f510f473a6392e4d"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD "displayName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leaderboard" ADD CONSTRAINT "PK_a77cb06009c75ceb055b231e120" PRIMARY KEY ("userId")`);
    }

}
