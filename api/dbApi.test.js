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
const { deleteGame } = require('./dbApi');

// Test data constants
const TEST_DATA = {
    PLAYER: {
        player_id: 10,
        nickname: 'human',
        is_pretender: false,
        game_id: 1,
    },
    GAME: {
        game_id: 1,
        config_id: 1,
        start_time: new Date(),
        end_time: new Date(),
    },
    GAME_CONFIGURATION: {
        game_id: 1,
        ai_prompt: 'test prompt',
        game_name: 'test game',
        theme_description: 'test theme',
        language_used: 'fi',
        instructions_for_players: 'test instructions',
        is_research_game: true,
        research_description: 'test research',
        language_model: 2,
        model_temperature: 0.5,
        answer_randomization: false,
    },
    GAME_PLAYERS: {
        game_id: 1,
        player_id: 10,
        joined_at: new Date(),
    },
    QUESTION: {
        question_id: 1,
        game_id: 1,
        question_text: 'test question',
        created: new Date(),
        judge_id: 10,
    },
    ANSWER: {
        answer_id: 1,
        question_id: 1,
        player_id: 10,
        answer_text: 'test answer',
        answer_order: 1,
        created: new Date(),
        is_pretender: false,
    },
};

// SQL queries
const SQL = {
    CREATE_TEMP_PLAYER_TABLE: `
        CREATE TEMPORARY TABLE IF NOT EXISTS PLAYER (
            player_id SERIAL,
            is_pretender BOOLEAN,
            nickname VARCHAR(100),
            game_id INTEGER,
            created_at TIMESTAMP,
            PRIMARY KEY(player_id)
        );
    `,
    INSERT_TEST_PLAYER: `
        INSERT INTO player (player_id, is_pretender, nickname, game_id, created_at)
        VALUES ($1, $2, $3, $4, NOW());
    `,
    CREATE_TEMP_GAME_TABLE: `
        CREATE TEMPORARY TABLE IF NOT EXISTS GAME (
           game_id SERIAL,
           config_id INTEGER,
           start_time TIMESTAMP,
           end_time TIMESTAMP,
           PRIMARY KEY(game_id)
        );
    `,
    INSERT_TEST_GAME: `
        INSERT INTO GAME (game_id, config_id, start_time, end_time)
        VALUES ($1, $2, $3, $4);`,
    CREATE_TEMP_GAME_CONFIGURATION_TABLE: `
        CREATE TEMPORARY TABLE IF NOT EXISTS GAME_CONFIGURATION (
           config_id SERIAL,
           ai_prompt TEXT,
           game_name VARCHAR(255),
           theme_description TEXT,
           language_used VARCHAR(255),
           instructions_for_players TEXT,
           is_research_game BOOLEAN,
           research_description TEXT,
           language_model INTEGER,
           model_temperature FLOAT,
           PRIMARY KEY(config_id)
        );
    `,
    INSERT_TEST_GAME_CONFIGURATION: `
        INSERT INTO GAME_CONFIGURATION (ai_prompt, game_name, theme_description, language_used, instructions_for_players, is_research_game, research_description, language_model, model_temperature)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
    CREATE_TEMP_GAME_PLAYERS_TABLE: `
        CREATE TEMPORARY TABLE IF NOT EXISTS GAME_PLAYERS (
           game_id INTEGER,
           player_id INTEGER,
           joined_at TIMESTAMP,
           PRIMARY KEY(game_id, player_id)
        );
    `,
    INSERT_TEST_GAME_PLAYERS: `
        INSERT INTO GAME_PLAYERS (game_id, player_id, joined_at)
        VALUES ($1, $2, $3);`,
    CREATE_TEMP_QUESTION_TABLE: `
        CREATE TEMPORARY TABLE IF NOT EXISTS QUESTION (
               question_id SERIAL,
               game_id INTEGER,
               question_text VARCHAR(255),
               created TIMESTAMP,
               judge_id INTEGER,
               PRIMARY KEY(question_id)
        );
    `,
    INSERT_TEST_QUESTION: `
        INSERT INTO QUESTION (question_id, game_id, question_text, created, judge_id)
        VALUES ($1, $2, $3, $4, $5);`,
    CREATE_TEMP_ANSWER_TABLE: `
        CREATE TEMPORARY TABLE IF NOT EXISTS ANSWER (
          answer_id INTEGER,
          question_id INTEGER,
          player_id INTEGER,
          answer_text VARCHAR(255),
          answer_order INTEGER,
          created TIMESTAMP,
          game_id INTEGER,
          is_pretender BOOLEAN,
          PRIMARY KEY(answer_id)
        );
    `,
    CREATE_TEMP_JUDGE_FINAL_GUESS_TABLE: `
      CREATE TEMPORARY TABLE IF NOT EXISTS JUDGE_FINAL_GUESS (
          final_guess_id SERIAL,
          game_id INTEGER REFERENCES GAME(game_id),
          judge_id INTEGER REFERENCES PLAYER(player_id),
          confidence INTEGER,
          was_correct BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          argument VARCHAR(500),
          PRIMARY KEY(final_guess_id),
          UNIQUE(game_id, judge_id)
      );
    `,
    CREATE_TEMP_PLAYER_COMBINATION: `
      CREATE TEMPORARY TABLE IF NOT EXISTS PLAYER_COMBINATION (
        game_id INTEGER REFERENCES GAME(game_id),
        judge_id INTEGER REFERENCES PLAYER(player_id),
        player_id INTEGER REFERENCES PLAYER(player_id)
      );
    `,
    CREATE_TEMP_GAME_ORGANIZER: `
      CREATE TEMPORARY TABLE IF NOT EXISTS GAME_ORGANIZER (
          id SERIAL,
          game_id integer REFERENCES GAME(game_id),
          user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP,
          PRIMARY KEY(game_id, user_id)
      );
    `,
    CREATE_TEMP_JUDGE_GUESS: `
      CREATE TEMPORARY TABLE IF NOT EXISTS JUDGE_GUESS (
        quess_id SERIAL,
        question_id INTEGER REFERENCES QUESTION(question_id),
        confidence integer,
        was_correct BOOLEAN,
        created TIMESTAMP,
        judge_id INTEGER REFERENCES PLAYER(player_id),
        answer_id INTEGER REFERENCES ANSWER(answer_id),
        argument VARCHAR(500),
        PRIMARY KEY(quess_id)
    );
    `,
    INSERT_TEST_ANSWER: `
        INSERT INTO ANSWER (answer_id, question_id, player_id, answer_text, answer_order, created, is_pretender)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
    SELECT_ALL_PLAYERS: 'SELECT * FROM PLAYER',
    SELECT_GAME_PLAYERS: 'SELECT * FROM GAME_PLAYERS WHERE game_id = $1',
    SELECT_ANSWER: 'SELECT * FROM ANSWER WHERE player_id = $1',
    SELECT_PLAYER: 'SELECT * FROM PLAYER WHERE game_id = $1',
    SELECT_GAME: 'SELECT * FROM GAME WHERE game_id = $1',
    SELECT_GAME_CONFIGURATION: 'SELECT * FROM GAME_CONFIGURATION WHERE config_id = $1',
    DROP_TEMP_TABLE:
        'DROP TABLE IF EXISTS answer, question, player, judge_guess, judge_final_guess, game_organizer, player_combination, game, game_configuration, game_players;',
};

// Utility functions
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createTestPlayer = async (playerData = TEST_DATA.PLAYER) => {
    await database.query(SQL.INSERT_TEST_PLAYER, [
        playerData.player_id,
        playerData.is_pretender,
        playerData.nickname,
        playerData.game_id,
    ]);
};

const createTestGame = async (gameData = TEST_DATA.GAME) => {
    await database.query(SQL.INSERT_TEST_GAME, [
        gameData.game_id,
        gameData.config_id,
        gameData.start_time,
        gameData.end_time,
    ]);
};

const createSecondTestGame = async (gameData = TEST_DATA.GAME) => {
    await database.query(SQL.INSERT_TEST_GAME, [
        gameData.game_id,
        gameData.config_id,
        gameData.start_time,
        gameData.end_time,
    ]);
};

const createTestGameConfiguration = async (
    gameDataConfiguration = TEST_DATA.GAME_CONFIGURATION,
) => {
    await database.query(SQL.INSERT_TEST_GAME_CONFIGURATION, [
        gameDataConfiguration.ai_prompt,
        gameDataConfiguration.game_name,
        gameDataConfiguration.theme_description,
        gameDataConfiguration.language_used,
        gameDataConfiguration.instructions_for_players,
        gameDataConfiguration.is_research_game,
        gameDataConfiguration.research_description,
        gameDataConfiguration.language_model,
        gameDataConfiguration.model_temperature,
    ]);
};

const createTestGamePlayers = async (gamePlayers = TEST_DATA.GAME_PLAYERS) => {
    await database.query(SQL.INSERT_TEST_GAME_PLAYERS, [
        gamePlayers.game_id,
        gamePlayers.player_id,
        gamePlayers.joined_at,
    ]);
};

const createTestQuestion = async (question = TEST_DATA.QUESTION) => {
    await database.query(SQL.INSERT_TEST_QUESTION, [
        question.question_id,
        question.game_id,
        question.question_text,
        question.created,
        question.judge_id,
    ]);
};

const createTestAnswer = async (answer = TEST_DATA.ANSWER) => {
    await database.query(SQL.INSERT_TEST_ANSWER, [
        answer.answer_id,
        answer.question_id,
        answer.player_id,
        answer.answer_text,
        answer.answer_order,
        answer.created,
        answer.is_pretender,
    ]);
};

const getAllPlayers = async () => {
    const result = await database.query(SQL.SELECT_ALL_PLAYERS);
    return result.rows;
};

const getGamePlayers = async (gameId) => {
    const result = await database.query(SQL.SELECT_GAME_PLAYERS, [gameId]);
    return result.rows;
};

const getAnswers = async (playerId) => {
    const result = await database.query(SQL.SELECT_ANSWER, [playerId]);
    return result.rows;
};

const insertAnswer = async (answer) => {
    const result = await database.query(SQL.INSERT_TEST_ANSWER, [
        answer.answer_id,
        answer.question_id,
        answer.player_id,
        answer.answer_text,
        answer.answer_order,
        answer.created,
        answer.is_pretender,
    ]);
    return result.rows[0];
};

const getPlayer = async (gameId) => {
    const result = await database.query(SQL.SELECT_PLAYER, [gameId]);
    return result.rows;
};

const getGame = async (gameId) => {
    const result = await database.query(SQL.SELECT_GAME, [gameId]);
    return result.rows;
};

const getGameConfiguration = async (gameId) => {
    const result = await database.query(SQL.SELECT_GAME_CONFIGURATION, [gameId]);
    return result.rows;
};

// Test setup and teardown
beforeAll(async () => {
    // Any initial setup SQL if required
});

beforeEach(async () => {
    // Create temporary table
    await database.query(SQL.CREATE_TEMP_PLAYER_TABLE);
    await database.query(SQL.CREATE_TEMP_GAME_TABLE);
    await database.query(SQL.CREATE_TEMP_GAME_CONFIGURATION_TABLE);
    await database.query(SQL.CREATE_TEMP_GAME_PLAYERS_TABLE);
    await database.query(SQL.CREATE_TEMP_QUESTION_TABLE);
    await database.query(SQL.CREATE_TEMP_ANSWER_TABLE);
    await database.query(SQL.CREATE_TEMP_JUDGE_FINAL_GUESS_TABLE);
    await database.query(SQL.CREATE_TEMP_JUDGE_GUESS);
    await database.query(SQL.CREATE_TEMP_PLAYER_COMBINATION);
    await database.query(SQL.CREATE_TEMP_GAME_ORGANIZER);

    // Insert test data
    await createTestPlayer();
    await createTestGame();
    await createTestGameConfiguration();
    await createTestGamePlayers();
    await createTestQuestion();
    await createTestAnswer();
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
        expect(players[0].is_pretender).toBe(TEST_DATA.PLAYER.is_pretender);
        expect(players[0].nickname).toBe(TEST_DATA.PLAYER.nickname);
        expect(players[0].game_id).toBe(TEST_DATA.PLAYER.game_id);
        expect(players[0].created_at).toBeInstanceOf(Date);
    });

    test('Handles multiple players', async () => {
        // Add another player
        const secondPlayer = {
            player_id: 11,
            is_pretender: false,
            nickname: 'Reiska',
            game_id: 21,
        };
        await createTestPlayer(secondPlayer);

        const players = await getAllPlayers();

        expect(players).toHaveLength(2);
        expect(players.find((p) => p.player_id === secondPlayer.player_id)).toBeDefined();
    });

    test('Delete from game_players table', async () => {
        const gameId = TEST_DATA.GAME.game_id;

        const game_players_before_delete = await getGamePlayers(gameId);
        expect(game_players_before_delete).toHaveLength(1);

        await deleteGame({ game_id: gameId }, {});

        const game_players_after_delete = await getGamePlayers(gameId);
        expect(game_players_after_delete).toHaveLength(0);
    });

    test('Get from answer table', async () => {
        const playerId = TEST_DATA.PLAYER.player_id;
        const answer = await getAnswers(playerId);
        expect(answer).toHaveLength(1);
    });

    test('Insert answer in answer table', async () => {
        const answerData = {
            answer_id: 2,
            question_id: 1,
            player_id: 10,
            answer_text: 'test answer 2',
            answer_order: 1,
            created: new Date(),
            is_pretender: false,
        };

        const result = await insertAnswer(answerData);

        expect(result).toBeDefined();
        expect(result.answer_id).toBeDefined();
        expect(result.question_id).toBe(answerData.question_id);
        expect(result.player_id).toBe(answerData.player_id);
        expect(result.answer_text).toBe(answerData.answer_text);
        expect(result.is_pretender).toBe(answerData.is_pretender);

        const answers = await getAnswers(answerData.player_id);
        expect(answers.length).toBe(2);
    });

    test('Delete from player table', async () => {
        const gameId = TEST_DATA.GAME.game_id;

        const players_before_delete = await getPlayer(gameId);
        expect(players_before_delete).toHaveLength(1);

        await deleteGame({ game_id: gameId }, {});

        const players_after_delete = await getPlayer(gameId);
        expect(players_after_delete).toHaveLength(0);
    });

    test('Delete from game table', async () => {
        const secondGame = {
            game_id: 2,
            config_id: 2,
            start_time: new Date(),
            end_time: new Date(),
        };

        await createSecondTestGame(secondGame);

        const gameId = TEST_DATA.GAME.game_id;

        let games_before_delete = await getGame(gameId);
        expect(games_before_delete).toHaveLength(1);
        games_before_delete = await getGame(2);
        expect(games_before_delete).toHaveLength(1);

        await deleteGame({ game_id: gameId }, {});

        let games_after_delete = await getGame(gameId);
        expect(games_after_delete).toHaveLength(0);

        games_after_delete = await getGame(2);
        expect(games_after_delete).toHaveLength(1);
    });

    test('Delete from game_configuration table', async () => {
        const gameId = TEST_DATA.GAME.game_id;

        const games_before_delete = await getGameConfiguration(gameId);
        expect(games_before_delete).toHaveLength(1);

        await deleteGame({ game_id: gameId }, {});

        const games_after_delete = await getGameConfiguration(gameId);
        expect(games_after_delete).toHaveLength(0);
    });
});
