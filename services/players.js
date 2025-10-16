const messageKeys = require('../utils/message-keys');
const dbApi = require('../api/dbApi');
const { logger } = require('../logger');
const database = require('./database');
const savePlayer = async (req, res) => {
    try {
        let data = req.body;
        const result = await dbApi.savePlayer(data);
        logger.info(`Player added or updated`);
        res.json({ message: result });
    } catch (error) {
        logger.error(`error inserting player`);
        const msg = error.message;
        logger.error(
            `Error POST /savePlayer ${error} ${msg}  USER ${req.body.user_id} PLAYER ${req.body.id}`,
        );
        res.status(500);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_ADD_PLAYER,
        });
    }
};

const pairs = async (req, res) => {
    try {
        const { gameId, judgeId } = req.params;
        const pairs = await database.execute('getGamePairs.sql', [gameId, judgeId]);
        res.json(pairs);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
}

module.exports = {
    savePlayer,
    pairs
};
