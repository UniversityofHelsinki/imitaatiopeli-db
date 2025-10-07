const { execute } = require('./database');

const insertAnswer = async (answer) => {
    const result = await execute('insertAnswer.sql', [
        answer.question_id,
        answer.player_id,
        answer.answer_text,
        answer.is_pretender,
        new Date(),
    ]);

    console.log('Insert result:', result); // Debug what's returned
    console.log('result[0]:', result[0]); // Debug the first element

    return {
        ...result[0],
    };
};

module.exports = {
    insertAnswer,
};
