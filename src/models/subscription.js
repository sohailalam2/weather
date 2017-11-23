'use strict';

const {getLatLong} = require('../tools/geocode');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// schema for the weather subscription model
const schema = new Schema({
    date: {type: Date, default: Date.now},
    address: {type: String, index: {unique: true, dropDups: true}},
    location: {
        type: {type: String, default: 'Point'},
        coordinates: {type: Array, default: []}
    },
    alert_min_temperature: Number,
    alert_max_temperature: Number,
}, {
    collection: 'subscription'
});

// before findOneAndUpdate hook
schema.pre('findOneAndUpdate', async function (next) {
    const updateObj = this.getUpdate().$set;

    // try to get the coordinates for the given address,
    // if failed don't subscribe
    try {
        if (!updateObj.location || updateObj.location.coordinates.length < 2) {
            const {location} = (await getLatLong(updateObj.address))[0];

            updateObj.location = {
                coordinates: [location.lat, location.lng]
            };
            next();
        }
    } catch (err) {
        next(err);
    }
});

const model = mongoose.model('SubscriptionModel', schema);

module.exports = model;
