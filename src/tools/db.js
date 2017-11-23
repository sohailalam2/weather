'use strict';

const mongoose = require('mongoose');
const redisDb = require('redis');
const logger = require('./logger');

mongoose.Promise = Promise;
const CHANNEL_WEATHER_UPDATE = 'weather-update';
const CHANNEL_WEATHER_ALERT = 'weather-alert';

let redisPubClient, redisSubClient;
let weatherUpdates = {};
let weatherAlerts = [];

/**
 * Helper function to do a bulk update
 *
 * @param model - the mongoose model
 * @param queryField - the query field for updating the item
 * @param bulkData - the data array to update
 * @returns {Promise.<Array>} - the promise with updated items array containing the query field values
 */
async function bulkUpdate(model, queryField, bulkData) {
    const bulk = model.collection.initializeUnorderedBulkOp();
    const updatedItems = [];

    bulkData.forEach(data => {
        const query = {};
        const fieldVal = data[queryField];

        query[queryField] = fieldVal;
        updatedItems.push(fieldVal);
        bulk.find(query).upsert().updateOne(data);
    });

    await bulk.execute();

    return updatedItems;
}

/**
 * The helper method to handle pub-sub events from redis
 *
 * @param channel - the subscription channel
 * @param message - the subscription data
 */
function redisSubscriptionHandler(channel, message) {
    try {
        const data = JSON.parse(message);

        if (data) {
            switch (channel) {
                case CHANNEL_WEATHER_UPDATE:
                    weatherUpdates = data;
                    logger.info(`Weather Update: ${JSON.stringify(data)}`);
                    break;
                case CHANNEL_WEATHER_ALERT:
                    weatherAlerts = [];
                    data.forEach((alert) => {
                        weatherAlerts.push(alert);
                        logger.info(`Weather Alert - ${alert.type}!! ${alert.address} : Limit ${alert.limit} : Actual ${alert.temperature}`);
                    });
                    break;
            }
        }
    } catch (e) {
        logger.error(e);
    }
}

/**
 * Helper function to connect to mongodb database
 * @param config - the database config object
 * @returns {Promise}
 */
async function connectMongodb({host, port, user, pass, db_name}) {
    return new Promise((resolve, reject) => {
        let uri;

        if (!db_name) return reject(new Error('Must specify a database name'));
        if (!host) host = 'localhost';
        if (!port) port = 27017;
        if (user && pass) uri = `mongodb://${user}:${pass}@${host}:${port}/${db_name}`;
        else uri = `mongodb://${host}:${port}/${db_name}`;

        logger.info(`Connecting to mongodb database ${host}:${port}`);
        mongoose
            .connect(uri, {
                useMongoClient: true,
                reconnectTries: 3,
                reconnectInterval: 500,
                bufferMaxEntries: 0
            })
            .on('error', err => reject(err))
            .once('open', () => {
                // register the schemas
                require('../models/subscription');
                require('../models/weather');

                logger.info(`Successfully connected to  mongodb database ${host}:${port}`);
                resolve();
            });
    });
}

/**
 * Helper function to connect to redis database
 * @param config - the database config object
 * @returns {Promise}
 */
async function connectRedis({host, port}) {
    return new Promise((resolve, reject) => {
        logger.info(`Connecting to redis database ${host}:${port}`);
        redisPubClient = redisDb.createClient({host, port});
        redisSubClient = redisDb.createClient({host, port});
        redisSubClient.on('connect', () => {
            logger.info(`Successfully connected to redis database ${host}:${port}`);
            resolve();
        })
            .on('error', reject)
            .on('message', redisSubscriptionHandler);
        redisSubClient.subscribe(CHANNEL_WEATHER_UPDATE);
        redisSubClient.subscribe(CHANNEL_WEATHER_ALERT);

    });
}

/**
 * Method to initialize all database connection
 *
 * @param config - the {mongodb, redis} config object
 * @returns {Promise}
 */
module.exports.init = async ({mongodb, redis}) =>
    Promise.all([await connectMongodb(mongodb), await connectRedis(redis)]);

/**
 * Gracefully shutdown all database connections
 *
 * @returns {Promise.<void>}
 */
module.exports.shutdown = async () => {
    mongoose.disconnect();
    redisPubClient.end(true);
    redisSubClient.end(true);
};

/**
 * Get the database model
 *
 * @param name - the name of the model
 */
module.exports.model = (name) => mongoose.model(name);

/**
 * Do a bulk update
 *
 * @type {bulkUpdate}
 */
module.exports.bulkUpdate = bulkUpdate;

/**
 * Subscribe for weather with a given subscription data
 *
 * @param sub - the subscription data {address, alert_min_temperature, alert_max_temperature}
 * @returns {Promise.<void>}
 */
module.exports.subscribeToWeather = async (sub) => {
    logger.info(`Subscribing to weather for ${sub.address}`);

    return mongoose.model('SubscriptionModel')
        .findOneAndUpdate({address: sub.address}, {$set: sub}, {upsert: true, new: true});
};

/**
 * Get all weather subscription data
 *
 * @returns {Promise.<void>}
 */
module.exports.getAllWeatherSubscriptions = async () => {
    return mongoose.model('SubscriptionModel').find();
};

module.exports.getWeatherData = async (addresses) => {
    return mongoose.model('WeatherModel').find({address: {$in: addresses}});
};

/**
 * Update weather information as a bulk update
 *
 * @param weathers - the array of weather data
 * @returns {Promise.<Array>}
 */
module.exports.updateWeatherBulk = async (weathers) => {
    logger.info('Updating weather database');
    const WeatherModel = mongoose.model('WeatherModel');

    return await bulkUpdate(WeatherModel, 'address', weathers);
};

/**
 * Send notifications to redis on the weather-notifications channel
 *
 * @param notifications - the notifications to send which will be serialized
 * @returns {Promise.<void>}
 */
module.exports.sendWeatherUpdateNotifications = async (notifications) =>
    redisPubClient.publish(CHANNEL_WEATHER_UPDATE, JSON.stringify(notifications));

/**
 * Send notifications to redis on the weather-alerts channel
 *
 * @param alerts - the alerts to send which will be serialized
 * @returns {Promise.<void>}
 */
module.exports.sendWeatherAlertNotifications = async (alerts) =>
    redisPubClient.publish(CHANNEL_WEATHER_ALERT, JSON.stringify(alerts));

/**
 * Get a copy of the weather alerts
 */
module.exports.getAllWeatherAlerts = async () => weatherAlerts.slice(0);
