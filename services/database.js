// Postgres client setup
const Pool = require('pg-pool');
const { read } = require('../sql/read');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
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

// Initialize database with default data
const initializeDefaultData = async () => {
    try {
        console.log('Starting default data initialization...');

        // Get all MODEL_*_URL environment variables
        const modelUrlKeys = Object.keys(process.env).filter(
            (key) => key.startsWith('MODEL_') && key.endsWith('_URL'),
        );

        if (modelUrlKeys.length === 0) {
            console.log('No MODEL_*_URL environment variables found');
            return;
        }

        let insertedCount = 0;
        let skippedCount = 0;

        for (const urlKey of modelUrlKeys) {
            const nameKey = urlKey.replace('_URL', '_NAME');
            const url = process.env[urlKey];
            const name = process.env[nameKey];

            if (!url || !name) {
                console.warn(`Skipping ${urlKey}: missing URL or NAME`);
                console.warn(`URL exists: ${!!url}, NAME exists: ${!!name}`);
                skippedCount++;
                continue;
            }

            const existingModel = await pool.query(
                'SELECT model_id, name, url FROM language_model WHERE name = $1',
                [name],
            );

            if (existingModel.rowCount === 0) {
                await pool.query(
                    'INSERT INTO language_model (name, url) VALUES ($1, $2) RETURNING model_id, name, url',
                    [name, url],
                );
                insertedCount++;
            } else {
                skippedCount++;
            }
        }
        console.log('Default data initialization completed');
    } catch (error) {
        console.error('Error initializing default data:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }
};

// Export both functions
exports.initializeDefaultData = initializeDefaultData;

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

// Export the initialization function in case you want to call it manually
exports.initializeDefaultData = initializeDefaultData;
