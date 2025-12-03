const fs = require('fs');
const path = require('path');
const { logger } = require('../logger');
const database = require('../services/database');
const messageKeys = require('../utils/message-keys');

exports.getPlayerById = async (req, res) => {
    try {
        const playerId = req.params.playerId;
        const getPlayerSQL = fs.readFileSync(
            path.resolve(__dirname, '../sql/getPlayerById.sql'),
            'utf8',
        );
        const getPlayerGameIdSQL = fs.readFileSync(
            path.resolve(__dirname, '../sql/getPlayerGameId.sql'),
            'utf8',
        );

        const playerResult = await database.query(getPlayerSQL, [playerId]);
        if (playerResult && playerResult.rowCount > 0) {
            const player = playerResult.rows[0];

            // Get the game ID for this player
            const gameResult = await database.query(getPlayerGameIdSQL, [playerId]);
            if (gameResult && gameResult.rowCount > 0) {
                player.gameId = gameResult.rows[0].game_id;
            }

            res.json(player);
        } else {
            res.json({
                message: messageKeys.PLAYER_NOT_EXISTS,
            });
        }
    } catch (err) {
        logger.error('Error reading player with playerID : ' + playerId + ' : ' + err);
        throw err;
    }
};

exports.getJudgeById = async (req, res) => {
    const playerId = req.params.playerId;
    const gameId = req.params.gameId;
    try {
        const getJudgeSQL = fs.readFileSync(
            path.resolve(__dirname, '../sql/getJudgeByGameIdAndPlayerId.sql'),
            'utf8',
        );

        const playerCombinationResult = await database.query(getJudgeSQL, [
            Number.parseInt(playerId),
            Number.parseInt(gameId),
        ]);
        if (playerCombinationResult && playerCombinationResult.rowCount > 0) {
            const judge = playerCombinationResult.rows[0];
            res.json(judge);
        } else {
            res.json({
                message: messageKeys.JUDGE_NOT_EXISTS,
            });
        }
    } catch (err) {
        logger.error('Error reading judge with playerID : ' + playerId + ' : ' + err);
        throw err;
    }
};

exports.deleteGame = async (req, res) => {
    const game_id = req?.game_id;
    const transaction = await database.transaction();
    const players = await transaction.query('getGamePlayersByGameId.sql', [game_id]);
    const playerIds = players?.map((r) => Number(r.player_id));
    await transaction.query('deleteJudgeFinalGuess.sql', [game_id]);
    if (playerIds.length > 0) {
        await transaction.query('deleteGamePlayers.sql', [game_id]);
        await transaction.query('deletePlayerPairs.sql', [game_id]);
        await transaction.query('deleteJudgeGuess.sql', [playerIds]);
        await transaction.query('deleteJudgeFinalGuessPlayers.sql', [playerIds]);
        await transaction.query('deletePlayers.sql', [playerIds]);
    }
    await transaction.query('deleteGameOrganizer.sql', [game_id]);
    await transaction.query('deleteAnswer.sql', [game_id]);
    await transaction.query('deleteQuestion.sql', [game_id]);
    await transaction.query('deleteGame.sql', [game_id]);
    await transaction.query('deleteConfiguration.sql', [game_id]);
    transaction.commit();
    transaction.end();
};

exports.getGamePlayersByGameIdAndJudgeId = async (req, res) => {
    const gameId = req?.game_id;
    const judgeId = req?.judge_id;
    try {
        const getGamePlayersSQL = fs.readFileSync(
            path.resolve(__dirname, '../sql/getGamePlayersByGameIdAndJudgeId.sql'),
            'utf8',
        );
        const playerCombinationResult = await database.query(getGamePlayersSQL, [
            Number.parseInt(gameId),
            Number.parseInt(judgeId),
        ]);
        if (playerCombinationResult && playerCombinationResult.rowCount > 0) {
            const player = playerCombinationResult.rows[0];
            res.json(player);
        } else {
            res.json({
                message: messageKeys.PLAYER_NOT_EXISTS,
            });
        }
    } catch (err) {
        logger.error(
            'Error reading player with gameId and judgeId : ' +
                gameId +
                ' ' +
                judgeId +
                ' : ' +
                err,
        );
        throw err;
    }
};

exports.savePlayer = async (player) => {
    try {
        if (player.player_id) {
            //player already in database
            const insertPlayerSQL = fs.readFileSync(
                path.resolve(__dirname, '../sql/insertOrUpdatePlayer.sql'),
                'utf8',
            );
            const result = await database.query(insertPlayerSQL, [
                player.player_id,
                player.is_pretender,
                player.game_id,
                new Date(),
            ]);
            if (result && result.rows.length > 0) {
                return messageKeys.PLAYER_UPDATED;
            } else {
                return null;
            }
        } else {
            //insert player
            const insertPlayerSQL = fs.readFileSync(
                path.resolve(__dirname, '../sql/insertPlayer.sql'),
                'utf8',
            );
            const result = await database.query(insertPlayerSQL, [
                player.is_pretender,
                player.game_id,
                new Date(),
            ]);
            if (result && result.rows.length > 0) {
                return messageKeys.PLAYER_ADDED;
            } else {
                return null;
            }
        }
    } catch (err) {
        logger.error(`Error inserting player : ${err} `);
        throw err;
    }
};

exports.getJudgeSummary = async (req, res) => {
    try {
        const { judgeId, gameId } = req.params;

        const sqlQuery = fs.readFileSync(
            path.resolve(__dirname, '../sql/getJudgeQuestionsAnswersGuessesByGameId.sql'),
            'utf8',
        );
        const results = await database.query(sqlQuery, [judgeId, gameId]);

        const questions = {};

        results.rows.forEach((row) => {
            if (!questions[row.question_id]) {
                questions[row.question_id] = {
                    question_id: row.question_id,
                    question_text: row.question_text,
                    created: row.created,
                    answers: [],
                    guesses: [],
                };
            }

            if (
                row.answer_id &&
                !questions[row.question_id].answers.some((a) => a.answer_id === row.answer_id)
            ) {
                questions[row.question_id].answers.push({
                    answer_id: row.answer_id,
                    answer_text: row.answer_text,
                    created: row.created,
                    is_pretender: row.is_pretender,
                });
            }

            if (
                row.quess_id &&
                !questions[row.question_id].guesses.some((g) => g.quess_id === row.quess_id)
            ) {
                questions[row.question_id].guesses.push({
                    quess_id: row.quess_id,
                    confidence: row.confidence,
                    was_correct: row.was_correct,
                    created: row.created,
                    argument: row.argument,
                });
            }
        });

        res.json(Object.values(questions));
    } catch (error) {
        console.error('Error fetching judge summary:', error);
        res.status(500).json({ error: 'Failed to fetch judge summary' });
    }
};
