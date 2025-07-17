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

module.exports = {
    get,
};
