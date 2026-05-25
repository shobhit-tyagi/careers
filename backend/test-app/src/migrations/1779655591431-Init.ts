import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779655591431 implements MigrationInterface {
    name = 'Init1779655591431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_reward_redemption_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reward_redemption_user_created"`);
        await queryRunner.query(`CREATE INDEX "IDX_9cb988ade6c1d825c2535e7667" ON "reward_redemptions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_75d43fb7f35cfe328147d59960" ON "reward_redemptions" ("user_id", "created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_75d43fb7f35cfe328147d59960"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9cb988ade6c1d825c2535e7667"`);
        await queryRunner.query(`CREATE INDEX "IDX_reward_redemption_user_created" ON "reward_redemptions" ("created_at", "user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_reward_redemption_status" ON "reward_redemptions" ("status") `);
    }

}
