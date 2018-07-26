'use strict';

const Promise = require('bluebird');
const moment = require('moment');
const Boom = require('boom');

const logger = require('./logger');

class BaseController {
    constructor(dao) {
        this.DAO = dao;

        this.controllerName = 'BaseController';
        this.requestIDKey = 'entityID';
        this.batchEntitiesKey = 'entities';
    }

    handle(action, request, reply, func) {
        let {hash} = request.query;
        hash = hash || '';

        const timerName = `${hash}.${this.controllerName}.handle.${action}`;
        console.time(timerName);
        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);
        return Promise.resolve(func)
            .then((result) => {
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                return reply(result);
            })
            .catch(err => {
                logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);
                if (err && (11000 == err.code || 11001 == err.code)) {
                    return reply(Boom.forbidden('please provide another id, it already exist'));
                }
                return reply(Boom.badImplementation(err)); // 500 error
            })
            .finally(result => {
                console.timeEnd(timerName);
                return result;
            });
    }

    get all() {
        return {
            handler: (request, reply) => {
                const {from} = request.query;
                const conditions = {};
                if (from) {
                    conditions.updated_at = {
                        $gt: moment(from).toDate()
                    }
                }

                this.handle('all', request, reply, this.DAO.all(conditions));
            }
        };
    }

    get get() {
        return {
            handler: (request, reply) => this.handle('get', request, reply, this.DAO.get(request.params[this.requestIDKey]))
        };
    }

    get upsert() {
        return {
            handler: (request, reply) => this.handle('upsert', request, reply, this.DAO.upsert(request.payload))
        }
    }

    get batch() {
        return {
            payload: {
                maxBytes: 1000 * 1000 * 50, // 50 Mb
                timeout: 1000 * 60 * 6, // 1.5 min, should be less 2 min - socket timeout
            },
            timeout: {
                socket: 1000 * 60 * 8 // 8 min, socket timeout
            },
            handler: (request, reply) => {
                this.handle('batch', request, reply,
                    Promise.map(request.payload[this.batchEntitiesKey],
                        propertyJSON => this.DAO.upsert(propertyJSON))
                );
            }
        }
    }

    get create() {
        return {
            handler: (request, reply) => this.handle('create', request, reply, this.DAO.create(request.payload))
        }
    }

    get update() {
        return {
            handler: (request, reply) => this.handle('update', request, reply, this.DAO.update(request.payload))
        };
    }

    get delete() {
        return {
            handler: (request, reply) => this.handle('update', request, reply, this.DAO.delete(this.requestIDKey))
        }
    }
}


module.exports = BaseController;
