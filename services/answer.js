const { execute } = require('./database');

const insertAnswer = async (answer) => {
    const configuration = await execute('gameConfiguration.sql', [answer.game_id]);
    const answerPosition =
        (answer.is_pretender && configuration[0].ai_answer_position) ||
        configuration[0].ai_answer_position === 1
            ? 2
            : 1;

    const result = await execute('insertAnswer.sql', [
        answer.question_id,
        answer.player_id,
        answer.answer_text,
        answer.is_pretender,
        answer.game_id,
        new Date(),
        answerPosition,
    ]);

    return {
        ...result[0],
    };
};

module.exports = {
    insertAnswer,
};
