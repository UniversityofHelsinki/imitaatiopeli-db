const { execute } = require('./database');

const create = async ({ game }) => {
    console.log('luodaan peli');
};

const get = async (id) => {
    const gameQueryResults = await execute('getGame.sql', [id]);

    const configurationQueryResults = await execute('getConfiguration.sql', [
        gameQueryResults[0].config_id,
    ]);

    return {
        ...gameQueryResults[0],
        configuration: configurationQueryResults[0],
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
        game.game_id,
        player.session_token,
        player.nickname,
    ]);
    await execute('insertPlayerToGame.sql', [
        game.game_id,
        playerQueryResults[0].player_id
    ]);

    return {
        ...playerQueryResults[0],
    };
};

const all = async (user) => {
    const games = await execute('allGames.sql');
    const configurations = await execute('allConfigurations.sql');

    const gamesByConfiguration = {};

    games.forEach((game) => {
        gamesByConfiguration[game.config_id] = game;
    });

    return configurations.map((configuration) => ({
        ...gamesByConfiguration[configuration.config_id],
        configuration,
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

module.exports = {
    get,
    getByCode,
    join,
    all,
    allLanguageModels,
    getLanguageModelById,
};
