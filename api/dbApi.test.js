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

// Test data constants
const TEST_DATA = {
    PLAYER: {
        player_id: 10,
        roles: 'human',
        game_id: 20,
    },
};

// SQL queries
const SQL = {
    CREATE_TEMP_PLAYER_TABLE: `
        CREATE TEMPORARY TABLE IF NOT EXISTS PLAYER (
            player_id SERIAL,
            roles VARCHAR(255),
            game_id INTEGER,
            created_at TIMESTAMP,
            PRIMARY KEY(player_id)
        );
    `,
    INSERT_TEST_PLAYER: `
        INSERT INTO player (player_id, roles, game_id, created_at) 
        VALUES ($1, $2, $3, NOW());
    `,
    SELECT_ALL_PLAYERS: 'SELECT * FROM PLAYER',
    DROP_TEMP_TABLE: 'DROP TABLE IF EXISTS pg_temp.player;',
};

// Utility functions
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createTestPlayer = async (playerData = TEST_DATA.PLAYER) => {
    await database.query(SQL.INSERT_TEST_PLAYER, [
        playerData.player_id,
        playerData.roles,
        playerData.game_id,
    ]);
};

const getAllPlayers = async () => {
    const result = await database.query(SQL.SELECT_ALL_PLAYERS);
    return result.rows;
};

// Test setup and teardown
beforeAll(async () => {
    // Any initial setup SQL if required
});

beforeEach(async () => {
    // Create temporary table
    await database.query(SQL.CREATE_TEMP_PLAYER_TABLE);

    // Insert test data
    await createTestPlayer();
});

afterEach(async () => {
    await wait(100); // Allow any pending operations to complete
    await database.query(SQL.DROP_TEMP_TABLE);
});

afterAll(async () => {
    await database.end();
});

// Tests
describe('Database tests', () => {
    test('Creates a new user to database', async () => {
        const players = await getAllPlayers();

        expect(players).toHaveLength(1);
        expect(players[0].player_id).toBe(TEST_DATA.PLAYER.player_id);
        expect(players[0].roles).toBe(TEST_DATA.PLAYER.roles);
        expect(players[0].game_id).toBe(TEST_DATA.PLAYER.game_id);
        expect(players[0].created_at).toBeInstanceOf(Date);
    });

    test('Handles multiple players', async () => {
        // Add another player
        const secondPlayer = {
            player_id: 11,
            roles: 'ai',
            game_id: 21,
        };
        await createTestPlayer(secondPlayer);

        const players = await getAllPlayers();

        expect(players).toHaveLength(2);
        expect(players.find((p) => p.player_id === secondPlayer.player_id)).toBeDefined();
    });
});
