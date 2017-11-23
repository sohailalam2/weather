'use strict';

const axios = require('axios');
const util = require('util');
const logger = require('./logger');

const {weather_api_key: key} = require('../../config.json');

const urlFormat = `https://api.darksky.net/forecast/${key}/%s,%s?exclude=hourly,minutely,flags`;

/**
 * Get the weather information
 * @param  {String}   address   The address
 * @param  {String}   latitude  The latitude of the location
 * @param  {String}   longitude The longitude of the location
 * @return {Promise}  The promise with weather data
 */
module.exports.getWeather = async (address, latitude, longitude) => {
    logger.info(`Requesting weather data for: ${address}`);
    const url = util.format(urlFormat, latitude, longitude);

    const {data, status} = await axios.get(url);

    // if request was successful then parse the data, else throw an error
    if (status === 200) {
        const {timezone} = data;
        const {summary, icon, temperature} = data.currently;
        const time = Number(data.currently.time) * 1000;

        const daily = data.daily.data.slice(0, 5).map(d => {
            const {icon, summary, temperatureMin, temperatureMax} = d;
            const time = Number(d.time) * 1000;

            return {time, icon, summary, temperatureMin, temperatureMax};
        });

        return {address, timezone, time, summary, icon, temperature, daily};
    } else {
        throw new Error('Non OK response - ' + data);
    }
};
