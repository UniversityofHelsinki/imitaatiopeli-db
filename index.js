require('dotenv').config();
const express = require('express');
const database = require('./services/database.js');
const path = require('node:path');
const fs = require('fs');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./api/routes.js');
const { logger, errorLogger } = require('./logger.js');

const app = express();
const router = express.Router();

const ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
const port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.use(compression());
app.use(helmet());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const initializeDatabase = async () => {
    try {
        // Test connection
        console.log('Testing database connection...');
        const res = await database.query('SELECT NOW()');
        console.log('✓ Postgres client connected', res.rows[0]);

        // Create tables
        console.log('Creating/verifying tables...');
        const createTables = fs.readFileSync(
            path.resolve(__dirname, './sql/createTables.sql'),
            'utf8',
        );
        await database.query(createTables);
        console.log('✓ Tables created/verified');

        // Initialize default data
        console.log('Initializing default data...');
        await database.initializeDefaultData();
        console.log('✓ Database initialization completed');
    } catch (err) {
        console.error('Database initialization error:', err);
        // Don't exit the process, but log the error
        logger.error('Failed to initialize database:', err);
    }
};

// Initialize database before setting up routes
const startServer = async () => {
    try {
        // Initialize database first
        await initializeDatabase();

        // Set up routes after database is ready
        app.use('/api', router);
        routes(router);

        // Start the server
        app.listen(port, ipaddress, () => {
            logger.info(
                `Node.js HTTP server is running on port ${port} and ip address ${ipaddress}`,
            );
            console.log('🚀 Server started successfully!');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        logger.error('Server startup failed:', error);
        process.exit(1);
    }
};

// Start the application
startServer();
