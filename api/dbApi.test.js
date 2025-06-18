const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const {
    describe,
    afterEach,
    beforeEach,
    beforeAll,
    afterAll,
    test,
    expect,
} = require('@jest/globals');
const database = require('../services/database');
const dbApi = require('./dbApi');

beforeAll(async () => {
    await database.query(`-- Any initial setup SQL if required`);
});

beforeEach(async () => {
    await database.query(`
        CREATE TEMPORARY TABLE IF NOT EXISTS PLAYER (
                                                    player_id SERIAL,
                                                    roles VARCHAR(255),
                                                    game_id integer,
                                                    created_at TIMESTAMP,
                                                    PRIMARY KEY(player_id)
                                                );
    `);

    // Insert a course
    await database.query(`
        INSERT INTO player (player_id, roles, game_id, created_at) VALUES
            ('10', 'human', '20', now());
    `);
});

afterEach(async () => {
    await wait(100);
    await database.query('DROP TABLE IF EXISTS pg_temp.player;');
});

describe('Database tests', () => {
    test('Creates a new user to database', async () => {
        let players = await database.query('SELECT * FROM PLAYER');

        expect(players.rows[0].player_id).toEqual(10);
        expect(players.rows[0].roles).toEqual('human');
    });
});

afterAll(async () => {
    await database.end();
});
