'use strict';

const winston = require('winston');
const path = require('path');
const mkdirp = require('mkdirp');
const config = require('../../config.json');

// Default logs config
if (!config.logs) config.logs = {};
if (!config.logs.path) config.logs.path = 'logs';
if (!config.logs.file_level) config.logs.file_level = 'debug';
if (!config.logs.console_level) config.logs.console_level = 'debug';

const logfilePath = path.join(__dirname, '../../', config.logs.path);

mkdirp(logfilePath);

const LOGGER = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            level: config.logs.console_level
        }),
        new(winston.transports.File)({
            filename: path.join(logfilePath, `${new Date().getTime()}.log`),
            level: config.logs.file_level,
            json: false
        })
    ]
});

LOGGER.stream = {
    write: function(message, encoding) {
        LOGGER.info(message);
    }
};

module.exports = LOGGER;
