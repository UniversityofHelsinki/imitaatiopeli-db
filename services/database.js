// Postgres client setup
const Pool = require('pg-pool');
const { read } = require('../sql/read');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: process.env.SSL ? true : false,
});

const query = async (text, values, client) => {
    try {
        const results = await client.query(text, values);
        if (results?.rowCount > 0) {
            return results.rows;
        }
        return [];
    } catch (error) {
        console.error(error.message);
        throw new Error(`Error while querying database ${error.message}`, { cause: error });
    }
};

const execute = async (file, values, client) => {
    try {
        const sql = await read(file);
        const results = await query(sql, values, client);
        return results;
    } catch (error) {
        console.error(error.message);
        throw new Error(`Error while reading sql ${file} with values ${values}`, { cause: error });
    }
};

exports.transaction = async () => {
    const client = await pool.connect();
    await client.query('BEGIN');

    const query = async (file, values) => {
        try {
            return execute(file, values, client);
        } catch (error) {
            console.error(error.message);
            await client.query('ROLLBACK');
            throw new Error(
                `Error during transaction while querying ${file} with values ${values}`,
                { cause: error },
            );
        }
    };

    const commit = async () => await client.query('COMMIT');
    const end = () => client.release();

    return { query, commit, end };
};

exports.execute = async (file, values) => await execute(file, values, pool);

exports.end = () => pool.end();

exports.query = (text, values) => pool.query(text, values);
