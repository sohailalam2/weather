'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/status', controller.getStatus);

router.get('/alerts', controller.getAlerts);

router.get('/weather/:address', controller.getWeather);

router.get('/subscriptions', controller.getSubscriptions);

router.post('/subscribe', controller.postSubscribe);

module.exports = router;
