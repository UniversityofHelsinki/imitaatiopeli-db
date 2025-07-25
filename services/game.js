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

module.exports = {
    get,
    all,
};
