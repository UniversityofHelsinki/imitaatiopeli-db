const { execute } = require('./database');
const fs = require('fs');
const path = require('path');
const database = require('./database');
const messageKeys = require('../utils/message-keys');
const { logger } = require('../logger');

const create = async ({ game }) => {
    console.log('luodaan peli');
};

const get = async (id) => {
    const gameQueryResults = await execute('getGame.sql', [id]);

    const configurationQueryResults = await execute('getConfiguration.sql', [
        gameQueryResults[0]?.config_id,
    ]);

    const languageModelQueryResults = await execute('getLanguageModelById.sql', [
        configurationQueryResults[0]?.language_model,
    ]);

    return {
        ...gameQueryResults[0],
        configuration: configurationQueryResults[0],
        languageModel: languageModelQueryResults[0],
    };
};

const getByCode = async (code) => {
    const gameQueryResults = await execute('getGameByCode.sql', [code]);

    if (!gameQueryResults[0]) {
        return null; // or `throw new Error('Game not found')`
    }

    const configurationQueryResults = await execute('getConfiguration.sql', [
        gameQueryResults[0].config_id,
    ]);

    return {
        ...gameQueryResults[0],
        configuration: configurationQueryResults,
    };
};

const join = async (player, game) => {
    const playerQueryResults = await execute('createPlayer.sql', [
        player.session_token,
        player.nickname,
        player.is_pretender,
    ]);
    await execute('insertPlayerToGame.sql', [game.game_id, playerQueryResults[0].player_id]);

    return {
        ...playerQueryResults[0],
        game_id: game.game_id,
    };
};

const all = async (eppn) => {
    const games = await execute('getUserGames.sql', [eppn]);
    if (!games || games.length === 0) {
        return [];
    }

    const gamesByConfiguration = {};

    for (const game of games) {
        const playerCount = await execute('getGamePlayerCount.sql', [game.game_id]);
        gamesByConfiguration[game.config_id] = {
            ...game,
            playerCount: parseInt(playerCount?.[0]?.player_count ?? 0, 10),
        };
    }

    return games.map((game) => ({
        ...gamesByConfiguration[game.config_id],
        configuration: {
            config_id: game.config_id,
            game_name: game.game_name,
            theme_description: game.theme_description,
            language_model: game.language_model,
            language_used: game.language_used,
            is_research_game: game.is_research_game,
            research_description: game.research_description,
        },
    }));
};

const allLanguageModels = async (user) => {
    const languageModels = await execute('allLanguageModels.sql');

    if (!languageModels[0]) {
        return null; // or `throw new Error('Game not found')`
    }

    return languageModels;
};

const getLanguageModelById = async (id) => {
    const languageModel = await execute('getLanguageModelById.sql', [id]);
    if (!languageModel[0]) {
        return null;
    }
    return languageModel[0];
};

const getQuestionByIdAndGameId = async (questionId, gameId) => {
    const question = await execute('getQuestionById.sql', [questionId, gameId]);
    if (!question[0]) {
        return null;
    }
    return question[0]?.question_text;
};

const getAIAnswerForQuestion = async (req, res) => {
    const { aiId, questionId, gameId } = req.params;
    try {
        const getAIAnswerForQuestionSQL = fs.readFileSync(
            path.resolve(__dirname, '../sql/getAIAnswerForQuestion.sql'),
            'utf8',
        );

        const AIAnswerForQuestionResult = await database.query(getAIAnswerForQuestionSQL, [
            Number.parseInt(aiId),
            Number.parseInt(questionId),
            Number.parseInt(gameId),
        ]);
        if (AIAnswerForQuestionResult && AIAnswerForQuestionResult.rowCount > 0) {
            const result = AIAnswerForQuestionResult.rows[0];
            res.json(result);
        } else {
            res.json({});
        }
    } catch (err) {
        logger.error('Error reading answer with AI id : ' + aiId + ' : ' + err);
        throw err;
    }
};

const getJudgeQuestions = async (req, res) => {
    const { judgeId, gameId } = req.params;
    try {
        const getJudgeQuestionsSQL = fs.readFileSync(
            path.resolve(__dirname, '../sql/getJudgeQuestions.sql'),
            'utf8',
        );

        const judgeQuestionsResult = await database.query(getJudgeQuestionsSQL, [
            Number.parseInt(judgeId),
            Number.parseInt(gameId),
        ]);
        if (judgeQuestionsResult && judgeQuestionsResult.rowCount > 0) {
            const result = judgeQuestionsResult.rows;
            res.json(result);
        } else {
            res.json({
                message: messageKeys.JUDGE_QUESTION_NOT_EXIST,
            });
        }
    } catch (err) {
        logger.error('Error reading judge question ' + err);
        throw err;
    }
};

const getQuestionById = async (questionId) => {
    const question = await execute('getQuestion.sql', [questionId]);
    if (!question[0]) {
        return null;
    }
    return question[0];
};

const allPromptTemplates = async () => {
    const promptTemplates = await execute('getPromptTemplates.sql');

    if (!promptTemplates[0]) {
        return null;
    }

    return promptTemplates;
};

module.exports = {
    get,
    getByCode,
    join,
    all,
    allLanguageModels,
    getLanguageModelById,
    getQuestionByIdAndGameId,
    getAIAnswerForQuestion,
    getJudgeQuestions,
    getQuestionById,
    allPromptTemplates,
};
