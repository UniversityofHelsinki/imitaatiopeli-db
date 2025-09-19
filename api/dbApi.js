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
        const result = await database.query(getPlayerSQL, [playerId]);
        if (result && result.rowCount > 0) {
            return result.rows[0];
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

exports.deleteGame = async (req, res) => {
    const game_id = req?.game_id;
    const transaction = await database.transaction();
    const players = await transaction.query('getGamePlayersByGameId.sql', [game_id]);
    const playerIds = players?.map((r) => Number(r.player_id));
    await transaction.query('deleteGamePlayers.sql', [game_id]);
    await transaction.query('deletePlayers.sql', [playerIds]);
    await transaction.query('deleteGame.sql', [game_id]);
    await transaction.query('deleteConfiguration.sql', [game_id]);
    transaction.commit();
    transaction.end();
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
