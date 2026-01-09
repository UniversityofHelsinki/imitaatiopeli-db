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
const { insertGuess } = require('./guess');

describe('guess service', () => {
    beforeEach(async () => {
        await database.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS JUDGE_GUESS (
                quess_id SERIAL PRIMARY KEY,
                question_id INTEGER,
                confidence INTEGER,
                was_correct BOOLEAN,
                created TIMESTAMP,
                judge_id INTEGER,
                answer_id INTEGER,
                argument VARCHAR(2000)
            );
        `);
    });

    afterEach(async () => {
        await database.query('DROP TABLE IF EXISTS JUDGE_GUESS;');
    });

    afterAll(async () => {
        await database.end();
    });

    test('insertGuess should insert a new guess', async () => {
        const guessData = {
            questionId: 1,
            confidence: 5,
            result: true,
            judgeId: 2,
            answerId: 3,
            argument: 'some reasoning',
        };

        const result = await insertGuess(guessData);

        expect(result).toBeDefined();
        expect(result.quess_id).toBeDefined();

        const guessesResult = await database.query('SELECT * FROM JUDGE_GUESS');
        const guesses = guessesResult.rows;
        expect(guesses).toHaveLength(1);
        expect(guesses[0].confidence).toBe(guessData.confidence);
        expect(guesses[0].was_correct).toBe(guessData.result);
        expect(guesses[0].argument).toBe(guessData.argument);
    });
});
