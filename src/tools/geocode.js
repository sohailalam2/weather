'use strict';

const logger = require('./logger');
const {google_api_key: key} = require('../../config.json');
const gmapClient = require('@google/maps').createClient({key});

/**
 * Get the latitude and longitude associated with a given address
 *
 * @param address - the address for which lat, long is needed
 * @returns {Promise} - promise resolving to an array of [{country, location: {lat, lng}}]
 */
module.exports.getLatLong = async function (address) {
    logger.info(`Getting geocode for ${address}`);
    return new Promise((resolve, reject) => {
        gmapClient.geocode({address}, (err, data) => {
            if (!!err) return reject(err);

            const {json} = data;

            switch (json.status) {
                case 'ZERO_RESULTS':
                    return reject(new Error(`No results found for address: ${address}`));
                case 'OK':
                    const found = [];

                    json.results.forEach(result => {
                        const country = result.address_components
                            .filter(address => address.types.includes('country'))
                            .map(item => item.long_name)[0];
                        const location = result.geometry.location;

                        found.push({country, location});
                    });

                    logger.info(`Found geocode for ${address}: `, JSON.stringify(found));
                    return resolve(found);
            }
        });
    });
};
