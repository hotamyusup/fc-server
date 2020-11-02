'use strict';
const Boom = require('boom');
const logger = require('../../../core/logger');

const BaseController = require("../../../core/base.controller");
const GeocoderService = require("../service/geocoder.service");

class GeocoderController extends BaseController {
    constructor() {
        super();
        this.controllerName = 'GeocoderController';
    }

    get geocodeObject() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'geocodeObject';

                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.payload)}`);

                const geoSearchObject = request.payload;

                if (!geoSearchObject) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} geo search object must be defined`);
                    return reply(Boom.badImplementation('Geo search object must be defined'));
                }

                return this.handle(action, request, reply, GeocoderService.geocode(geoSearchObject));
            }
        };
    }

    get geocode() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'geocode';

                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {searchString} = request.params;

                if (!searchString) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} Search string must be defined`);
                    return reply(Boom.badImplementation('Search string must be defined'));
                }

                return this.handle(action, request, reply, GeocoderService.geocode(searchString));
            }
        };
    }
}

module.exports = new GeocoderController();
