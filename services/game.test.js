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
const { get, getByCode, join, all } = require('./game');

describe('game service', () => {
    beforeEach(async () => {
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS LANGUAGE_MODEL (
                model_id SERIAL PRIMARY KEY,
                name VARCHAR(255)
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS GAME_CONFIGURATION (
                config_id SERIAL PRIMARY KEY,
                game_name VARCHAR(255),
                language_model INTEGER REFERENCES LANGUAGE_MODEL(model_id),
                theme_description VARCHAR(255),
                language_used VARCHAR(255),
                is_research_game BOOLEAN,
                research_description VARCHAR(255)
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS GAME (
                game_id SERIAL PRIMARY KEY,
                config_id INTEGER REFERENCES GAME_CONFIGURATION(config_id),
                game_code VARCHAR(255) UNIQUE,
                start_time TIMESTAMP,
                end_time TIMESTAMP
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS PLAYER (
                player_id SERIAL PRIMARY KEY,
                nickname VARCHAR(100),
                session_token VARCHAR(255),
                is_pretender BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS GAME_PLAYERS (
                game_id INTEGER REFERENCES GAME(game_id),
                player_id INTEGER REFERENCES PLAYER(player_id),
                PRIMARY KEY (game_id, player_id)
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS GAME_ORGANIZER (
                game_id INTEGER REFERENCES GAME(game_id),
                user_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (game_id, user_id)
            );
        `);
    });

    afterEach(async () => {
        await database.query(
            'DROP TABLE IF EXISTS GAME_ORGANIZER, GAME_PLAYERS, PLAYER, GAME, GAME_CONFIGURATION, LANGUAGE_MODEL CASCADE;',
        );
    });

    afterAll(async () => {
        await database.end();
    });

    test('get should return game with configuration and language model', async () => {
        const lmId = 20;
        const configId = 10;
        const gameId = 1;
        await database.query('INSERT INTO LANGUAGE_MODEL (model_id, name) VALUES ($1, $2)', [
            lmId,
            'gpt-4',
        ]);
        await database.query(
            'INSERT INTO GAME_CONFIGURATION (config_id, language_model) VALUES ($1, $2)',
            [configId, lmId],
        );
        await database.query('INSERT INTO GAME (game_id, config_id) VALUES ($1, $2)', [
            gameId,
            configId,
        ]);

        const game = await get(gameId);

        expect(game).toBeDefined();
        expect(game.game_id).toBe(gameId);
        expect(game.configuration.config_id).toBe(configId);
        expect(game.languageModel.model_id).toBe(lmId);
    });

    test('getByCode should return game and its configuration', async () => {
        const code = 'TESTCODE';
        const configId = 10;
        await database.query(
            'INSERT INTO GAME_CONFIGURATION (config_id, game_name) VALUES ($1, $2)',
            [configId, 'test'],
        );
        await database.query(
            'INSERT INTO GAME (game_id, config_id, game_code) VALUES ($1, $2, $3)',
            [1, configId, code],
        );

        const game = await getByCode(code);

        expect(game).toBeDefined();
        expect(game.game_code).toBe(code);
        expect(game.configuration[0].config_id).toBe(configId);
    });

    test('join should create a player and add them to the game', async () => {
        const gameId = 100;
        const configId = 50;
        await database.query('INSERT INTO GAME_CONFIGURATION (config_id) VALUES ($1)', [configId]);
        await database.query('INSERT INTO GAME (game_id, config_id) VALUES ($1, $2)', [
            gameId,
            configId,
        ]);

        const player = { nickname: 'tester', session_token: 'token1', is_pretender: false };
        const game = { game_id: gameId };

        const result = await join(player, game);

        expect(result).toBeDefined();
        expect(result.nickname).toBe(player.nickname);
        expect(result.game_id).toBe(gameId);

        const playersResult = await database.query('SELECT * FROM PLAYER WHERE nickname = $1', [
            player.nickname,
        ]);
        expect(playersResult.rows).toHaveLength(1);
        const gpResult = await database.query(
            'SELECT * FROM GAME_PLAYERS WHERE game_id = $1 AND player_id = $2',
            [gameId, result.player_id],
        );
        expect(gpResult.rows).toHaveLength(1);
    });

    test('all should return games for a user', async () => {
        const user_id = 'user1';
        const configId = 10;
        const gameId = 1;
        await database.query(
            'INSERT INTO GAME_CONFIGURATION (config_id, game_name) VALUES ($1, $2)',
            [configId, 'G1'],
        );
        await database.query('INSERT INTO GAME (game_id, config_id) VALUES ($1, $2)', [
            gameId,
            configId,
        ]);
        await database.query('INSERT INTO GAME_ORGANIZER (game_id, user_id) VALUES ($1, $2)', [
            gameId,
            user_id,
        ]);

        // Add some players to the game
        await database.query(
            "INSERT INTO PLAYER (player_id, nickname) VALUES (1, 'P1'), (2, 'P2')",
        );
        await database.query('INSERT INTO GAME_PLAYERS (game_id, player_id) VALUES (1, 1), (1, 2)');

        const games = await all(user_id);

        expect(Array.isArray(games)).toBe(true);
        expect(games.length).toBe(1);
        expect(games[0].playerCount).toBe(2);
    });
});
