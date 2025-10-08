const { execute } = require('./database');

const insertAnswer = async (answer) => {
    const result = await execute('insertAnswer.sql', [
        answer.question_id,
        answer.player_id,
        answer.answer_text,
        answer.is_pretender,
        answer.game_id,
        new Date(),
    ]);

    return {
        ...result[0],
    };
};

module.exports = {
    insertAnswer,
};
