'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema for weather information model
const schema = new Schema({
    address: {type: String, index: {unique: true, dropDups: true}},
    timezone: String,
    time: Number,
    summary: String,
    icon: String,
    temperature: Number,
    daily: [
        {
            time: Number,
            summary: String,
            icon: String,
            temperatureMin: Number,
            temperatureMinTime: Number,
            temperatureMax: Number,
            temperatureMaxTime: Number
        }
    ]
}, {
    collection: 'weather'
});

const model = mongoose.model('WeatherModel', schema);

module.exports = model;
