'use strict';

const Boom = require('boom');
const logger = require('./logger');

class BaseController {
    constructor(){
        this.controllerName = 'BaseController';
    }

    handle(action, request, reply, func){
        const {hash} = request.query;
        return Promise.resolve(func)
            .then((result) => {
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                return reply(result);
            })
            .catch(err => {
                logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);
                return reply(Boom.badImplementation(err)); // 500 error
            });
    }

    all(request, reply) {}
    get(request, reply) {}
    upsert(request, reply) {}
    batch(request, reply) {}
    create(request, reply) {}
    update(request, reply) {}
};


module.exports = BaseController;
