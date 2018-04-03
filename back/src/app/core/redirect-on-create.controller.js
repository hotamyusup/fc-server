'use strict';

const Promise = require('bluebird');
const Boom = require('boom');

const BaseController = require(".base.controller");
const logger = require("./logger");

class RedirectOnCreateController extends BaseController {
    constructor(dao) {
        super(dao);
        this.redirectUrl = '/redirect/url/before/id/';
    }

    get upsert() {
        return {
            handler: (request, reply) => {
                const {hash} = request.query;
                const action = 'upsert';

                return this.DAO
                    .upsert(request.payload)
                    .then((model) => {
                        if (model.get('__v') === 0) {
                            logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success - new`);
                            return reply(model).created(this.redirectUrl + model._id); // HTTP 201
                        } else {
                            logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success - update`);
                            return reply(model); // HTTP 201
                        }

                        return reply(model);
                    })
                    .catch(err => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);
                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden('please provide another id, it already exist'));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });
            }
        };
    }

    get create() {
        return {
            handler: (request, reply) => {
                const {hash} = request.query;
                const action = 'create';

                return this.DAO
                    .create(request.payload)
                    .then((model) => {
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                        return reply(model).created(this.redirectUrl + model._id); // HTTP 201
                    })
                    .catch(err => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);

                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden('please provide another id, it already exist'));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });
            }
        };
    }
}

module.exports = new PropertyController();






