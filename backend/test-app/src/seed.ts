import { Challenge, ChallengeDifficulty } from './entities/Challenge';
import { Reward } from './entities/Reward';
import dataSource from "./config/data-source";

const SEED_CHALLENGES = [
    {
        title: 'All Night',
        artist: 'Camo & Krooked',
        description:
            'Listen to this drum & bass classic to earn points',
        pointsValue: 150,
        durationSeconds: 219,
        difficulty: ChallengeDifficulty.EASY,
    },
    {
        title: 'New Forms',
        artist: 'Roni Size',
        description:
            'Complete this legendary track for bonus points',
        pointsValue: 300,
        durationSeconds: 464,
        difficulty: ChallengeDifficulty.MEDIUM,
    },
    {
        title: 'Extended Session',
        artist: 'Camo & Krooked',
        description:
            'A longer listening challenge for dedicated fans',
        pointsValue: 500,
        durationSeconds: 600,
        difficulty: ChallengeDifficulty.HARD,
    },
];

const SEED_REWARDS = [
    {
        name: 'Early Access Pass',
        description: 'Get early access to new features',
        pointsCost: 200,
    },
    {
        name: 'Exclusive Playlist',
        description: 'Unlock a curated artist playlist',
        pointsCost: 500,
    },
    {
        name: 'VIP Fan Badge',
        description: 'Show off your dedication with a VIP badge',
        pointsCost: 1000,
    },
    {
        name: 'Concert Ticket Raffle',
        description: 'Enter a raffle for concert tickets',
        pointsCost: 2500,
    },
];

async function seed() {
    await dataSource.initialize();

    const challengeRepo =
        dataSource.getRepository(Challenge);
    const rewardRepo =
        dataSource.getRepository(Reward);

    // ---------------- CHALLENGES ----------------
    for (const c of SEED_CHALLENGES) {
        const exists = await challengeRepo.findOne({
            where: {
                title: c.title,
                artist: c.artist,
            },
        });

        if (exists) continue;

        await challengeRepo.save(
            challengeRepo.create({
                ...c,
                isActive: true,
            }),
        );
    }

    // ---------------- REWARDS ----------------
    for (const r of SEED_REWARDS) {
        const exists = await rewardRepo.findOne({
            where: { name: r.name },
        });

        if (exists) continue;

        await rewardRepo.save(
            rewardRepo.create({
                ...r,
                isActive: true,
            }),
        );
    }

    await dataSource.destroy();
}

seed()
    .then(() => {
        console.log('Seed complete');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Seed failed', err);
        process.exit(1);
    });