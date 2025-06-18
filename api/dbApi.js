const fs = require('fs');
const path = require('path');
const { logger } = require('../logger');
const database = require('../services/database');

exports.getPlayerById = async (playerId) => {
    try {
        const getPlayerSQL = fs.readFileSync(
            path.resolve(__dirname, '../sql/getPlayerById.sql'),
            'utf8',
        );
        const result = await database.query(getPlayerSQL, [playerId]);
        if (result && result.rowCount > 0) {
            return result.rows[0];
        } else {
            return null;
        }
    } catch (err) {
        logger.error('Error reading player with playerID : ' + playerId + ' : ' + err);
        throw err;
    }
};
