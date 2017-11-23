'use strict';

const logger = require('../tools/logger');
const {subscribeToWeather, getAllWeatherAlerts, getAllWeatherSubscriptions, getWeatherData} = require('../tools/db');
const {getWeather} = require('../tools/weather');
const {getLatLong} = require('../tools/geocode');

// GET /status
module.exports.getStatus = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            date: new Date(),
            pid: process.pid
        }
    });
};

// GET /alerts
module.exports.getAlerts = async (req, res) => {
    res.status(200).json({
        success: true,
        data: await getAllWeatherAlerts()
    });
};

// GET /weather/:address
module.exports.getWeather = async (req, res) => {
    const {address} = req.params;

    if (!address) {
        return res.status(400).json({
            status: false,
            error: 'Missing required fields - address'
        });
    }

    try {
        const latLongs = (await getLatLong(address));

        if (latLongs.length > 1) {
            return res.send({
                success: true,
                data: {
                    locations: latLongs
                }
            });
        }

        const weather = await getWeather(address, latLongs[0].location.lat, latLongs[0].location.lng);

        res.status(200).json({
            success: true,
            data: weather
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            error: e.message,
            stack: e.stack
        });
    }
};

module.exports.getSubscriptions = async (req, res) => {
    try {
        const subs = (await getAllWeatherSubscriptions()).map(s => s.address);
        const weatherData = await getWeatherData(subs);
        res.json(weatherData);
    } catch (e) {
        res.status(500).json({
            success: false,
            error: e.message,
            stack: e.stack
        });
    }
};

// PORT /subscribe - { address, alert_min_temperature, alert_max_temperature }
module.exports.postSubscribe = async (req, res) => {
    const {address, alert_min_temperature, alert_max_temperature} = req.body;

    if (!address || !alert_min_temperature || !alert_max_temperature) {
        return res.status(400).json({
            status: false,
            error: 'Missing required fields - address, alert_min_temperature or alert_max_temperature'
        });
    }

    try {
        const {location} = await subscribeToWeather({address, alert_min_temperature, alert_max_temperature});

        if (location && location.coordinates.length === 2) {
            const weather = await getWeather(address, ...location.coordinates);

            res.status(200).json({
                success: true,
                data: weather
            });
        } else {
            throw new Error('No coordinates found for the given location');
        }
    } catch (e) {
        logger.error(e);
        res.status(500).json({
            success: false,
            error: e.message
        })
    }
};
