const {
    describe,
    afterEach,
    beforeEach,
    beforeAll,
    afterAll,
    test,
    expect,
} = require('@jest/globals');
const database = require('./database');
const { pairs, playercount } = require('./players');

describe('players service', () => {
    beforeEach(async () => {
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS PLAYER (
                player_id SERIAL PRIMARY KEY,
                nickname VARCHAR(100)
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS GAME_PLAYERS (
                game_id INTEGER,
                player_id INTEGER,
                PRIMARY KEY (game_id, player_id)
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS PLAYER_COMBINATION (
                game_id INTEGER,
                judge_id INTEGER,
                player_id INTEGER
            );
        `);
    });

    afterEach(async () => {
        await database.query('DROP TABLE IF EXISTS PLAYER_COMBINATION, GAME_PLAYERS, PLAYER;');
    });

    afterAll(async () => {
        await database.end();
    });

    test('pairs should return game pairs for a judge', async () => {
        const gameId = 1;
        const judgeId = 2;
        await database.query(
            'INSERT INTO PLAYER_COMBINATION (game_id, judge_id, player_id) VALUES ($1, $2, $3)',
            [gameId, judgeId, 3],
        );

        const req = { params: { gameId, judgeId } };
        const res = { json: jest.fn() };

        await pairs(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ game_id: gameId, judge_id: judgeId, player_id: 3 }),
            ]),
        );
    });

    test('playercount should return player count for a game', async () => {
        const gameId = 1;
        await database.query(
            'INSERT INTO GAME_PLAYERS (game_id, player_id) VALUES ($1, $2), ($1, $3)',
            [gameId, 1, 2],
        );

        const req = { params: { gameId } };
        const res = { json: jest.fn() };

        await playercount(req, res);

        expect(res.json).toHaveBeenCalledWith(2);
    });
});
