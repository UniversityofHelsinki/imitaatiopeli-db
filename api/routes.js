const { logger } = require('../logger');
const { savePlayer } = require('../services/players');
const { getPlayerById } = require('./dbApi');

module.exports = (router) => {
    router.get('/hello', (req, res) => {
        logger.info('hello world');
        res.json({ message: 'Hello, world!' });
    });

    router.get('/getplayerById/:playerId', getPlayerById);
    router.post('/saveplayer', savePlayer);
};
