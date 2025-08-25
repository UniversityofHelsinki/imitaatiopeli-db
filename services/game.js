const { execute } = require('./database');

const create = async ({ game }) => {
    console.log('luodaan peli');
};

const get = async (id) => {
    const gameQueryResults = await execute('getGame.sql', [id]);

    const configurationQueryResults = await execute('getConfiguration.sql', [
        gameQueryResults[0].config_id,
    ]);
    const backgroundInfoQueryResults = await execute('getBackgroundInfo.sql', [
        gameQueryResults[0].config_id,
    ]);
    const customBackgroundInfoQueryResults = await execute('getCustomBackgroundInfo.sql', [
        gameQueryResults[0].config_id,
        backgroundInfoQueryResults[0].id,
    ]);

    return {
        ...gameQueryResults[0],
        configuration: configurationQueryResults[0],
        background_info: backgroundInfoQueryResults[0],
        custom_background_info: customBackgroundInfoQueryResults[0],
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

module.exports = {
    get,
    getByCode,
    join,
    all,
    allLanguageModels,
};
