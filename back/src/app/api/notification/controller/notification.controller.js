'use strict';

const BaseController = require("../../../core/base.controller");
const NotificationDAO = require("../dao/notification.dao");

class NotificationController extends BaseController {
    constructor() {
        super(NotificationDAO);
        this.controllerName = 'NotificationController';
        this.requestIDKey = 'NotificationID';
        this.batchEntitiesKey = 'Notifications';
    }

    markNotificationAsRead() {
        return {
            handler: async (request, reply) => {
                const {hash} = request.query;
                const NotificationID = request.params[this.requestIDKey];
                const action = 'markNotificationAsRead';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start NotificationID = ${NotificationID}`);

                const notification = NotificationDAO.get(NotificationID);
                if (notification) {
                    notification.Read = true;
                    const savedNotification = await notification.save();
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} done NotificationID = ${NotificationID}`);
                    reply(savedNotification);
                }
            }
        }
    }
}

module.exports = new NotificationController();
