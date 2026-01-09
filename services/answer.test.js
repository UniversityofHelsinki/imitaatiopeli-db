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
const { insertAnswer } = require('./answer');

describe('answer service', () => {
    beforeEach(async () => {
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS GAME_CONFIGURATION (
                config_id SERIAL PRIMARY KEY,
                ai_answer_position INTEGER
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS GAME (
                game_id SERIAL PRIMARY KEY,
                config_id INTEGER
            );
        `);
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS ANSWER (
                answer_id SERIAL PRIMARY KEY,
                question_id INTEGER,
                player_id INTEGER,
                answer_text VARCHAR(2000),
                answer_order INTEGER,
                created TIMESTAMP,
                is_pretender BOOLEAN,
                game_id INTEGER
            );
        `);
    });

    afterEach(async () => {
        await database.query('DROP TABLE IF EXISTS GAME_CONFIGURATION, GAME, ANSWER;');
    });

    afterAll(async () => {
        await database.end();
    });

    test('insertAnswer should insert a new answer', async () => {
        const gameId = 1;
        const configId = 100;
        await database.query(
            'INSERT INTO GAME_CONFIGURATION (config_id, ai_answer_position) VALUES ($1, $2)',
            [configId, 1],
        );
        await database.query('INSERT INTO GAME (game_id, config_id) VALUES ($1, $2)', [
            gameId,
            configId,
        ]);

        const answerData = {
            game_id: gameId,
            question_id: 1,
            player_id: 1,
            answer_text: 'test answer content',
            is_pretender: false,
        };

        const result = await insertAnswer(answerData);

        expect(result).toBeDefined();
        expect(result.answer_id).toBeDefined();

        const answersResult = await database.query('SELECT * FROM ANSWER');
        const answers = answersResult.rows;
        expect(answers).toHaveLength(1);
        expect(answers[0].answer_text).toBe(answerData.answer_text);
    });
});
