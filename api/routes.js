const { logger } = require('../logger');
const { execute } = require('../services/database');
const game = require('../services/game');
const { savePlayer, pairs } = require('../services/players');
const { getPlayerById, deleteGame, getJudgeById } = require('./dbApi');
const crypto = require('node:crypto');
const { insertAnswer } = require('../services/answer');
const { insertGuess } = require('../services/guess');
const { getAIAnswerForQuestion, getJudgeQuestions } = require('../services/game');

module.exports = (router) => {
    router.get('/hello', (req, res) => {
        logger.info('hello world');
        res.json({ message: 'Hello, world!' });
    });

    router.get('/getPlayerById/:playerId', getPlayerById);
    router.get('/getJudgeById/:playerId/:gameId', getJudgeById);

    router.get('/getJudgeQuestions/:judgeId/:gameId', getJudgeQuestions);
    router.get('/getAIAnswerForQuestion/:aiId/:questionId/:gameId', getAIAnswerForQuestion);

    router.get('/players/pairs/:gameId/:judgeId', pairs);

    router.post('/saveplayer', savePlayer);

    router.get('/game/:id', async (req, res) => {
        const { id } = req.params;
        res.json(await game.get(id));
    });

    router.delete('/game/deleteGame', async (req, res) => {
        await deleteGame(req.body);
        res.status(200).end();
    });

    router.post('/game/create', async (req, res) => {
        const { body } = req;
        const configuration = await execute('createConfiguration.sql', [
            body.configuration.ai_prompt,
            body.configuration.game_name,
            body.configuration.theme_description,
            body.configuration.language_used,
            body.configuration.instructions_for_players,
            body.configuration.is_research_game,
            body.configuration.research_description,
            body.configuration.language_model,
            body.configuration.model_temperature,
            body.configuration.answer_randomization,
        ]);

        const game = await execute('createGame.sql', [
            configuration[0].config_id,
            body.gameCode,
            body.userId,
        ]);

        if (game?.length === 1) {
            return res.json({
                ...game[0],
                configuration: configuration[0],
            });
        }

        return res.status(500).end();
    });

    router.put('/game/edit', async (req, res) => {
        const { body } = req;

        const queryResults = await execute('editConfiguration.sql', [
            body.configuration.ai_prompt,
            body.configuration.game_name,
            body.configuration.theme_description,
            body.configuration.language_used,
            body.configuration.instructions_for_players,
            body.configuration.is_research_game,
            body.configuration.research_description,
            body.configuration.language_model,
            body.configuration.model_temperature,
            body.configuration.config_id,
            body.configuration.answer_randomization,
        ]);

        if (queryResults?.length === 1) {
            return res.json(await game.get(body.game_id));
        }

        return res.status(500).end();
    });

    router.put('/game/:id/start', async (req, res) => {
        const { id } = req.params;

        const aiPlayer = await execute('getAiPlayer.sql', []);

        const players = await execute('getGamePlayersByGameId.sql', [id]);

        const pairs = players
            .map((player, i) => [
                [id, player.player_id, players[(i + 1) % players.length].player_id],
                [id, player.player_id, aiPlayer[0].player_id],
            ])
            .flat();

        for (const pair of pairs) {
            await execute('createPair.sql', pair);
        }

        await execute('startGame.sql', [id]);
        return res.status(200).end();
    });

    router.put('/game/:id/end', async (req, res) => {
        const { id } = req.params;
        await execute('endGame.sql', [id]);
        return res.status(200).end();
    });

    router.get('/games/:eppn', async (req, res) => {
        const { eppn } = req.params;
        res.json(await game.all(eppn));
    });

    router.get('/languageModels', async (req, res) => {
        const result = await game.allLanguageModels();
        if (!result) {
            return res.status(404).json({ error: 'No language models found' });
        }
        res.json(result);
    });

    router.get('/languageModelUrl/:id', async (req, res) => {
        const { id } = req.params;
        const result = await game.getLanguageModelById(id);
        if (!result) {
            return res.status(404).json({ error: 'No language models found' });
        }
        res.json(result);
    });

    router.get('/game/question/:questionId/:gameId', async (req, res) => {
        const { questionId, gameId } = req.params;
        const result = await game.getQuestionByIdAndGameId(questionId, gameId);
        if (!result) {
            return res.status(404).json({ error: 'No questions found' });
        }
        res.json(result);
    });

    router.get('/game/code/:code', async (req, res) => {
        const { code } = req.params;
        return res.json(await game.getByCode(code));
    });

    router.post('/game/join', async (req, res) => {
        const { body } = req;
        const g = await game.getByCode(body.code);
        if (g) {
            const player = await game.join(
                {
                    nickname: body.nickname,
                    session_token: crypto.randomUUID(),
                    is_pretender: false,
                },
                g,
            );
            res.json({
                ...player,
                theme_description: g.configuration[0]?.theme_description,
                language_used: g.configuration[0]?.language_used,
            });
        }
    });

    router.get('/games/:id/lobby', async (req, res) => {
        const { id } = req.params;
        res.json(await game.get(id));
    });

    router.get('/games/:id/players', async (req, res) => {
        const { id } = req.params;

        try {
            const players = await execute('getGamePlayers.sql', [id]);
            res.json(players);
        } catch (error) {
            logger.error('Error fetching players for game:', error);
            res.status(500).json({ error: 'Failed to fetch players' });
        }
    });

    router.post('/game/saveQuestion', async (req, res) => {
        try {
            const { judgeId, gameId, questionText } = req.body;

            const result = await execute('insertQuestion.sql', [judgeId, gameId, questionText]);

            if (result?.length === 1) {
                res.json(result[0]);
            } else {
                res.status(500).json({ error: 'Failed to save question' });
            }
        } catch (error) {
            logger.error('Error saving question:', error);
            res.status(500).json({ error: 'Failed to save question' });
        }
    });

    router.get('/games/:id/judgeplayerpairs', async (req, res) => {
        const { id } = req.params;

        try {
            const players = await execute('getJudgePlayerPairsOfGame.sql', [id]);
            res.json(players);
        } catch (error) {
            logger.error('Error fetching judgeplayerpairs for game:', error);
            res.status(500).json({ error: 'Failed to fetch judgeplayerpairs' });
        }
    });

    router.post('/game/answer', async (req, res) => {
        const { body } = req;
        const result = await insertAnswer({
            question_id: body.questionId,
            player_id: body.playerId,
            answer_text: body.answer,
            game_id: body.gameId,
            is_pretender: body.is_pretender ? true : false,
        });
        res.json(result);
    });

    router.get('/aiPlayer', async (req, res) => {
        const result = await execute('getAiPlayer.sql', []);
        if (!result) {
            return res.status(404).json({ error: 'No ai player found' });
        }
        res.json(result[0]);
    });

    router.get('/getAnswerById/:answerId', async (req, res) => {
        const { answerId } = req.params;
        const result = await execute('getAnswerById.sql', [answerId]);
        if (!result) {
            return res.status(404).json({ error: 'No answer found' });
        }
        res.json(result[0]);
    });

    router.get('/question/:questionId', async (req, res) => {
        const { questionId } = req.params;
        const result = await game.getQuestionById(questionId);
        if (!result) {
            return res.status(404).json({ error: 'No questions found' });
        }
        res.json(result);
    });

    router.get('/games/:id/playroomPlayerPairs', async (req, res) => {
        const { id } = req.params;
        try {
            const players = await execute('getJudgePlayerPairsOfGame.sql', [id]);
            res.json(players);
        } catch (error) {
            logger.error('Error fetching player pairs for game:', error);
            res.status(500).json({ error: 'Failed to fetch player pairs' });
        }
    });

    router.post('/guess/save', async (req, res) => {
        const { body } = req;

        const result = await insertGuess({
            questionId: body.questionId,
            confidence: body.confidence,
            result: body.result,
            judgeId: body.judgeId,
            answerId: body.answerId,
            argument: body.argument,
        });
        res.json(result);
    });

    router.get('/judge/summary/:judgeId/:gameId', async (req, res) => {
        try {
            const { judgeId, gameId } = req.params;

            const result = await execute('getJudgeQuestionsAnswersGuessesByGameId.sql', [
                judgeId,
                gameId,
            ]);

            if (!result) {
                return res.status(404).json({ error: 'No judge summary found' });
            }
            res.json(result);
        } catch (error) {
            logger.error('Error fetching judge summary:', error);
            res.status(500).json({ error: 'Failed to fetch judge summary' });
        }
    });

    router.post('/judge/finalGuess', async (req, res) => {
        try {
            const { gameId, judgeId, confidence, is_pretender, argument } = req.body;

            const result = await execute('insertFinalGuess.sql', [
                gameId,
                judgeId,
                confidence,
                is_pretender,
                argument,
            ]);

            if (!result) {
                return res.status(500).json({ error: 'Failed to save final guess' });
            }
            return res.json(result);
        } catch (error) {
            logger.error('Error saving final judge guess:', error);
            return res.status(500).json({ error: 'Failed to save final guess' });
        }
    });

    router.get('/game/:id/player/:playerId/unansweredQuestion', async (req, res) => {
        const { id, playerId } = req.params;
        const gamePairsByPlayerId = await execute('getGamePairs.sql', [id, playerId]);

        const match = gamePairsByPlayerId.find(
            (item) => Number(item.player_id) === Number(playerId),
        );
        const judgeId = match ? match.judge_id : null;

        const result = await execute('getUnansweredQuestionByGameIdAndPlayerId.sql', [id, judgeId]);
        if (!result || result.length === 0) {
            return res.status(200).json({});
        }
        res.json(result[0]);
    });

    router.get('/game/:id/player/:playerId/answersForRatingForm', async (req, res) => {
        const { id, playerId } = req.params;
        const questionCountResult = await execute('getQuestionCount.sql', [playerId, id]);
        const result = await execute('getAnswersForRatingForm.sql', [id, playerId]);
        const questionCount = Number(questionCountResult?.[0]?.count ?? 0);
        const updatedResult = result.map((item) => ({
            ...item,
            questionCount,
        }));
        if (!updatedResult) {
            return res.status(200).json({ error: 'No initial answers found' });
        }
        res.json(updatedResult);
    });

    router.get('/game/:gameId/judge/:judgeId/questionCount', async (req, res) => {
        const { gameId, judgeId } = req.params;
        const result = await execute('getQuestionCount.sql', [judgeId, gameId]);
        const questionCount = Number(result?.[0]?.count ?? 0);
        if (!questionCount) {
            return res.status(404).json({ error: 'No question count found' });
        }
        res.json(questionCount);
    });

    router.get('/languageSuffix/:languageCode', async (req, res) => {
        const { languageCode } = req.params;
        const result = await execute('getPromptSuffixByLanguage.sql', [languageCode]);
        if (!result) {
            return res.status(404).json({ error: 'No language suffix found' });
        }
        res.json(result[0]);
    });

    router.get('/game/:id/gameDataToExcel', async (req, res) => {
        const { id } = req.params;
        const result = await execute('gameDataToExcel.sql', [id]);
        if (!result) {
            return res.status(404).json({ error: 'No excel found' });
        }

        const configuration = await execute('gameConfiguration.sql', [id]);
        const promptSuffixTemplate = await execute('getPromptSuffixByLanguage.sql', [
            configuration[0]?.language_used,
        ]);
        const languageModel = await execute('getLanguageModelById.sql', [
            configuration[0]?.language_model,
        ]);

        res.json({
            gameData: result,
            gameConfiguration: configuration?.[0],
            promptSuffixTemplate: promptSuffixTemplate,
            languageModel: languageModel?.[0],
        });
    });
};
