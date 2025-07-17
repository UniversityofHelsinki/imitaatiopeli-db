const { logger } = require('../logger');
const { execute } = require('../services/database');
const game = require('../services/game');
const { savePlayer } = require('../services/players');
const { getPlayerById } = require('./dbApi');

module.exports = (router) => {
    router.get('/hello', (req, res) => {
        logger.info('hello world');
        res.json({ message: 'Hello, world!' });
    });

    router.get('/getplayerById/:playerId', getPlayerById);
    router.post('/saveplayer', savePlayer);

    router.get('/game/:id', async (req, res) => {
        const { id } = req.params;
        res.json(await game.get(id));
    });

    router.post('/game/create', async (req, res) => {
        const { body } = req;

        const configuration = await execute('createConfiguration.sql', [
            body.configuration.game_name,
            body.configuration.ai_prompt,
        ]);

        const game = await execute('createGame.sql', [configuration[0].config_id]);

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
            body.configuration.config_id,
        ]);

        if (queryResults?.length === 1) {
            return res.json(await game.get(body.game_id));
        }

        return res.status(500).end();
    });
};
