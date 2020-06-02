'use strict';

const _ = require('underscore');
const Promise = require('bluebird');
const moment = require('moment');
const Boom = require('boom');
const {parseAsync} = require('json2csv');

const logger = require('./logger');

class BaseController {
    constructor(dao) {
        this.DAO = dao;

        this.controllerName = 'BaseController';
        this.requestIDKey = 'entityID';
        this.batchEntitiesKey = 'entities';
    }

    getCurrentUser(request) {
        return request.auth && request.auth.credentials;
    }

    async handle(action, request, reply, promise) {
        let {hash, format, filename} = request.query;
        hash = hash || '';

        const timerName = `${hash}.${this.controllerName}.handle.${action}`;
        console.time(timerName);
        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);
        return Promise
            .resolve(promise)
            .then(async result => {
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                if (format === 'csv' || format === 'csv-file') {
                    const csv = await this.parseCSV(result);

                    if (format === 'csv-file') {
                        const defaultFilename = `${this.batchEntitiesKey}.${action}.report.csv;`;

                        return reply(csv)
                            .header('Content-Type', 'application/octet-stream')
                            .header('content-disposition', `attachment; filename=${filename || defaultFilename}`);
                    } else {
                        return reply(csv);
                    }
                } else {
                    return reply(result);
                }
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
                const {from, sort, limit, skip} = request.query;

                const options = {
                    sort: sort ? JSON.parse(decodeURIComponent(sort)) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    skip: skip ? parseInt(skip) : undefined
                };

                const conditions = {};
                if (from) {
                    conditions.updated_at = {
                        $gt: moment(from).toDate()
                    }
                }

                this.handle('all', request, reply, this.DAO.all(conditions, options));
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
            handler: (request, reply) => {
                const upsertFlow = this.DAO.upsert(request.payload).then(upsertedEntity => {
                    this.onUpsert(upsertedEntity, this.getCurrentUser(request));
                    return upsertedEntity;
                });

                return this.handle('upsert', request, reply, upsertFlow);
            }
        }
    }

    get batch() {
        return {
            payload: {
                maxBytes: 1024 * 1024 * 50, // 50 Mb
                timeout: 1000 * 60 * 6, // 1.5 min, should be less 2 min - socket timeout
            },
            timeout: {
                socket: 1000 * 60 * 8 // 8 min, socket timeout
            },
            handler: (request, reply) => {
                const action = 'batch';
                const {hash} = request.query;

                const batchUpsertEntityFn = entityJSON => this.DAO.upsert(entityJSON).then(upsertedEntity => {
                    this.onUpsert(upsertedEntity, this.getCurrentUser(request));
                    return upsertedEntity;
                });

                this.handle(action, request, reply,
                    Promise
                        .map(request.payload[this.batchEntitiesKey], batchUpsertEntityFn)
                        .catch(error => {
                            logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error: ${error}`);
                            throw error;
                        })
                );
            }
        }
    }

    get getBatch() {
        return {
            handler: (request, reply) => {
                this.handle('getBatch', request, reply, this.DAO.all({_id: {$in: request.payload}}));
            }
        }
    }

    get create() {
        return {
            handler: (request, reply) => {
                const createFlow = this.DAO.create(request.payload).then(createdEntity => {
                    this.onCreate(createdEntity, this.getCurrentUser(request));
                    return createdEntity;
                });

                return this.handle('create', request, reply, createFlow);
            }
        }
    }

    get update() {
        return {
            handler: (request, reply) => {
                const updateFlow = this.DAO.update(request.payload).then(updatedEntity => {
                    this.onUpdate(updatedEntity, this.getCurrentUser(request));
                    return updatedEntity;
                });

                return this.handle('update', request, reply, updateFlow);
            }
        };
    }

    get delete() {
        return {
            handler: (request, reply) => this.handle('delete', request, reply, this.DAO.delete(request.params[this.requestIDKey]))
        }
    }

    get copy() {
        return {
            handler: (request, reply) => this.handle('copy', request, reply, this.DAO.copy(request.params[this.requestIDKey]))
        }
    }

    async parseCSV(result) {
        if (!_.isArray(result)) {
            result = [result];
        }

        const fields = {};
        _.forEach(result, entity => {
            if (entity.schema) {
                entity.schema.eachPath(function (field) {
                    fields[field] = field;
                });
            } else {
                Object.keys(entity).map(field => fields[field] = field);
            }
        });

        const opts = {fields: Object.keys(fields)};
        const csv = await parseAsync(result, opts);

        return csv;
    }

    onCreate(createdEntity, currentUser) {

    }

    onUpdate(updatedEntity, currentUser) {

    }

    onUpsert(upsertedEntity, currentUser) {

    }
}


module.exports = BaseController;
