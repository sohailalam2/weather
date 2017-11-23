'use strict';

const config = require('../../config.json');
const db = require('../tools/db');
const logger = require('../tools/logger');
const {getWeather} = require('../tools/weather');

/**
 * Helper function to check for temperature alerts
 *
 * @param subscriptions
 * @param temperatureMap
 * @returns {Promise.<void>}
 */
async function checkForAlerts(subscriptions, temperatureMap) {
    return subscriptions.map(subscription => {
        const temperature = temperatureMap[subscription.address];
        const alert = {
            address: subscription.address,
            temperature: temperature
        };

        if (temperature > subscription.alert_max_temperature) {
            alert.type = 'alert_max_temperature';
            alert.limit = subscription.alert_max_temperature;
        } else if (temperature < subscription.alert_min_temperature) {
            alert.type = 'alert_min_temperature';
            alert.limit = subscription.alert_min_temperature;
        }

        if(!!alert.type) {
            logger.info(`Weather Alert - ${alert.type}!! ${alert.address} : Limit ${alert.limit} : Actual ${alert.temperature}`);
            return alert;
        }
    }).filter(a => !!a)
}

/**
 * Helper function to check subscription models for max/min temperature
 * and send alerts if the temperature range is breached for that address
 *
 * @param subscriptions
 * @param allWeather
 * @returns {Promise.<void>}
 */
async function sendNotifications(subscriptions, allWeather) {
    const temperatureMap = {};

    allWeather.forEach(w => temperatureMap[w.address] = w.temperature);

    await db.sendWeatherUpdateNotifications(temperatureMap);

    const alerts = await checkForAlerts(subscriptions, temperatureMap);

    if(alerts.length > 0) {
        await db.sendWeatherAlertNotifications(alerts);
    }
}

(async () => {
    try {
        // try to connect to the database
        await db.init(config.database);

        // get weather information for all subscriptions
        const subscriptions = await db.getAllWeatherSubscriptions();
        const allWeatherPromise = subscriptions.map(async (sub) => {
            const [lat, lng] = sub.location.coordinates;

            return await getWeather(sub.address, lat, lng);
        });

        // update database with weather information
        const allWeather = await Promise.all(allWeatherPromise);
        const updates = await db.updateWeatherBulk(allWeather);
        // check for alerts
        await sendNotifications(subscriptions, allWeather);

        await db.shutdown();
    } catch (e) {
        logger.error(e);
    }
})();
