'use strict';

const BaseController = require("../../../core/base.controller");
const NotificationDAO = require("../dao/notification.dao");
const logger = require('../../../core/logger');

class NotificationController extends BaseController {
    constructor() {
        super(NotificationDAO);
        this.controllerName = 'NotificationController';
        this.requestIDKey = 'NotificationID';
        this.batchEntitiesKey = 'Notifications';
    }

    get all() {
        return {
            handler: (request, reply) => {
                const {hash, sort, limit, skip} = request.query;
                const currentUser = this.getCurrentUser(request);

                const options = {
                    sort: sort ? JSON.parse(decodeURIComponent(sort)) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    skip: skip ? parseInt(skip) : undefined,
                };

                const conditions = {
                    User: currentUser
                };

                this.handle('all', request, reply, this.DAO.all(conditions, options));
            }
        };
    }


    get markAllNotificationsAsRead() {
        return {
            handler: async (request, reply) => {
                const action = 'markAllNotificationsAsRead';
                const {hash} = request.query;
                const currentUser = request.auth && request.auth.credentials;
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);
                return this.handle(action, request, reply, NotificationDAO.markAllRead(currentUser));
            }
        }
    }

    get markNotificationAsRead() {
        return {
            handler: async (request, reply) => {
                const action = 'markNotificationAsRead';
                const {hash} = request.query;
                const NotificationID = request.params[this.requestIDKey];
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start NotificationID = ${NotificationID}`);
                try {
                    const notification = await NotificationDAO.get(NotificationID);
                    console.log(`${notification.User}`);
                    console.log(`${this.getCurrentUser(request)._id}`);
                    if (notification && (`${notification.User}` == `${this.getCurrentUser(request)._id}`)) {
                        notification.Read = true;
                        const savedNotification = await notification.save();
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} done NotificationID = ${NotificationID}`);

                        return this.handle(action, request, reply, savedNotification);
                    } else {
                        return this.handle(action, request, reply, false);
                    }
                } catch (error) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error = ${error}`);
                    throw error;
                }
            }
        }
    }
}

module.exports = new NotificationController();
