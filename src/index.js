'use strict';

const config = require('../config.json');
const db = require('./tools/db');
const logger = require('./tools/logger');
const api = require('./api');

(async () => {

    try {
        // try to connect to the database
        await db.init(config.database);

        // update the subscriptions list as par the config.json
        if (Array.isArray(config.subscriptions)) {
            config.subscriptions.forEach(async (sub) =>
                await db.subscribeToWeather(sub));
        }

        // start the api and web server
        await api.startServer(config.server.port, config.server.host);
    } catch (e) {
        logger.error(e);
    }

})();
