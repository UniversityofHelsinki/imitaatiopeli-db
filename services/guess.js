const { execute } = require('./database');

const insertGuess = async (data) => {
    const result = await execute('insertGuess.sql', [
        data.questionId,
        data.confidence,
        data.result,
        new Date(),
        data.judgeId,
        data.answerId,
        data.argument,
    ]);

    return {
        ...result[0],
    };
};

module.exports = {
    insertGuess,
};
