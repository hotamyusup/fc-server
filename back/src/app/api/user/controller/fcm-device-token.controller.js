'use strict';

const BaseController = require("../../../core/base.controller");
const logger = require("../../../core/logger");

const FCMDeviceTokenDAO = require("../dao/fcm-device-token.dao");

class FCMDeviceTokenController extends BaseController {
    constructor() {
        super(FCMDeviceTokenDAO);
        this.controllerName = 'FCMDeviceTokenController';
        this.requestIDKey = 'TokenID';
        this.batchEntitiesKey = '';
    }

    get addTokenToUser() {
        return {
            handler: async (request, reply) => {
                const {hash} = request.query;
                const action = 'addTokenToUser';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);
                const {payload} = request;

                if (!payload.Token || !payload.UserAgent) {
                    const errorMessage = `Token ${payload.Token} or UserAgent ${payload.UserAgent} not received`;
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} failed, ${errorMessage}`);
                    return reply(Boom.forbidden(new Error(errorMessage)));
                }

                const currentUser = request.auth && request.auth.credentials;

                try {
                    const savedUser = await FCMDeviceTokenDAO.upsertToken(currentUser._id, payload.Token, payload.UserAgent);
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} added`);
                    return reply(savedUser)
                } catch (err) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);
                    return reply(Boom.forbidden(err)); // HTTP 403
                }
            }
        };
    }

    get deleteTokenFromUser() {
        return {
            handler: async (request, reply) => {
                const {hash} = request.query;
                const action = 'deleteTokenFromUser';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);
                const {payload} = request;

                if (!payload.Token) {
                    const errorMessage = `Token ${payload.Token} not received`;
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} failed, ${errorMessage}`);
                    return reply(Boom.forbidden(new Error(errorMessage)));
                }

                const currentUser = request.auth && request.auth.credentials;

                try {
                    const savedUser = await FCMDeviceTokenDAO.deleteToken(currentUser._id, payload.Token);
                    return reply(savedUser)
                } catch (err) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);
                    return reply(Boom.forbidden(err)); // HTTP 403
                }
            }
        };
    }
}

module.exports = new FCMDeviceTokenController();
