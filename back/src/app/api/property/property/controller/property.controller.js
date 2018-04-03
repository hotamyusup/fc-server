'use strict';

const Promise = require('bluebird');
const Boom = require('boom');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const PropertyDAO = require("../dao/property.dao");

class PropertyController extends BaseController {
    constructor() {
        super();
        this.controllerName = 'PropertyController';
    }

    get all() {
        return {
            handler: (request, reply) => {
                this.handle('all', request, reply, PropertyDAO.all());
            }
        };
    }

    get upsert() {
        return {
            handler: (request, reply) => {
                const {hash} = request.query;
                const propertyJSON = request.payload;

                return PropertyDAO
                    .upsert(propertyJSON)
                    .then((property) => {
                        if (property.get('__v') === 0) {
                            logger.info(`properties.upsert ${hash} saved new`);
                            return reply(property).created('/property/' + property._id); // HTTP 201
                        } else {
                            logger.info(`properties.upsert ${hash} updated`);
                            return reply(property); // HTTP 201
                        }
                    })
                    .catch(err => {
                        logger.info(`properties.upsert ${hash} update ${err}`);
                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden('please provide another id, it already exist'));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });
            }
        };
    }

    get get() {
        return {
            handler: (request, reply) => this.handle('get', request, reply, PropertyDAO.get(request.params.PropertyID))
        };
    }

    get batch() {
        return {
            handler: (request, reply) => {
                const properties = request.payload.properties;
                this.handle('batch', request, reply, Promise.map(properties, propertyJSON => PropertyDAO.upsert(propertyJSON)));
            }
        }
    }

    get create() {
        return {
            handler: (request, reply) => {
                const {hash} = request.query;

                return PropertyDAO
                    .create(request.payload)
                    .then((property) => {
                        logger.info(`properties.create ${hash} saved new`);
                        return reply(property).created('/property/' + property._id); // HTTP 201
                    })
                    .catch(err => {
                        logger.info(`properties.create ${hash} error ${err}`);
                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden('please provide another id, it already exist'));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });
            }
        };
    }

    get update() {
        return {
            handler: (request, reply) => this.handle('update', request, reply, PropertyDAO.update(request.params))
        };
    }
}

module.exports = new PropertyController();






