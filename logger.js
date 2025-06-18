const winston = require('winston');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

exports.logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
});
