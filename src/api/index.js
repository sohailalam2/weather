'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const path = require('path');
const logger = require('../tools/logger');

/**
 * Setup the Express js application and returns the configured app
 * @return {Express.Application} The express app
 */
function setupApp() {
    const app = express();

    app.use(express.static(path.join(__dirname, '..', 'public')));

    // activate the logger
    app.use(require('morgan')('combined', {
        'stream': logger.stream
    }));
    // parse the request body
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(bodyParser.json());
    // Log requests to console
    app.use(morgan('dev'));
    // load all routes
    loadAllRoutes(app);
    return app;
}

/**
 * Load all routes from routes file automatically and inject them into the
 * express app route
 *
 * This will escape any file that has .spec.js extension and will not load the route
 * if the router file exports a property **disableRouter** as true. Also as a mandatory requirement,
 * the router file must export a function named **initialize** which can be used to initialize the route and
 * the function inturn must return the express.Router object.
 *
 * The routes will be automatically loaded with context derieved from its filename, hence, a router file
 * by the name users.route.js will expose the routes as /users.
 * As a special case, any api route defined in a file named index.route.js will be available to the default context
 * as well as the named context, hence available as / as well as /index.
 *
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
function loadAllRoutes(app) {
    app.use('/', require('./routes'));

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    });
}

/**
 * Start the server by binding to the given host and port
 * @param  {number} port The port number on which the server must listen to incoming requests
 * @param  {string} host The host on which the server must be bound to
 */
async function startServer(port, host) {
    return new Promise((resolve, reject) => {
        const app = setupApp();
        const server = http.createServer(app);
        // Listen on provided port, on all network interfaces.
        server.listen(port, host);
        server.on('error', (error) => {
            reject(error);
            if (error.syscall !== 'listen') {
                throw error;
            }

            const bind = typeof port === 'string' ?
                'Pipe ' + port :
                'Port ' + port;

            // handle specific listen errors with friendly messages
            switch (error.code) {
                case 'EACCES':
                    logger.error(`${bind} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    logger.error(`${bind} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
        server.on('listening', () => {
            const addr = server.address();
            logger.info(`API Server is listening on ${JSON.stringify(addr)}`);
            resolve();
        });
    });
}

module.exports = {
    startServer,
    setupApp
};
