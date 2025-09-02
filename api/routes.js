const { logger } = require('../logger');
const { execute } = require('../services/database');
const game = require('../services/game');
const { savePlayer } = require('../services/players');
const { getPlayerById, deleteGame } = require('./dbApi');
const crypto = require('node:crypto');

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

    router.delete('/game/deleteGame', deleteGame);

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
        ]);

        const game = await execute('createGame.sql', [
            configuration[0].config_id,
            crypto.randomUUID(),
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
            body.configuration.config_id,
        ]);

        if (queryResults?.length === 1) {
            return res.json(await game.get(body.game_id));
        }

        return res.status(500).end();
    });

    router.put('/game/:id/start', async (req, res) => {
        const { id } = req.params;
        await execute('startGame.sql', [id]);
        return res.status(200).end();
    });

    router.put('/game/:id/end', async (req, res) => {
        const { id } = req.params;
        await execute('endGame.sql', [id]);
        return res.status(200).end();
    });

    router.get('/games', async (req, res) => {
        const { params } = req;

        res.json(await game.all(params.user));
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
                    game_id: g.game_id,
                    session_token: crypto.randomUUID(),
                },
                g,
            );
            res.json(player);
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

};
