'use strict';

const _ = require('underscore');
const Promise = require('bluebird');

const config = require('../../../../config/config');
const logger = require('../../../core/logger');

const NodeGeocoder = require('node-geocoder');

const options = {
    provider: 'google',
    apiKey: config.google.apiKey,
    // httpAdapter: 'http', // have to be https
};
const geocoder = NodeGeocoder(options);

class GeocoderService {
    async geocode(geoObjectOrString) {
        return new Promise((resolve, reject) => {
            logger.info(`GeocoderService.geocode(${JSON.stringify(geoObjectOrString)})`);
            try {
                geocoder.geocode(geoObjectOrString, function (err, res) {
                        if (!err) {
                            if (!err && res && res.length > 0) {
                                console.log('geocoder.geocode() res.length === ', res.length);
                                resolve(res);
                            } else {
                                resolve();
                            }
                        } else {
                            logger.error(`GeocoderService.geocode(${JSON.stringify(geoObjectOrString)}) geocoder error ${err}`);
                            resolve();
                        }
                    }
                );
            } catch (error) {
                logger.error(`GeocoderService.geocode(${JSON.stringify(geoObjectOrString)}) error ${error}`);
                throw error;
            }
        });
    }
}

module.exports = new GeocoderService();
