import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779695866784 implements MigrationInterface {
    name = 'Init1779695866784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "failed_login_attempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locked_until" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locked_until"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failed_login_attempts"`);
    }

}
