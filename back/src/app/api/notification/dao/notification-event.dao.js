'use strict';
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment-timezone');

const config = require('../../../../config/config');
const logger = require('../../../core/logger');

const BaseDAO = require("../../../core/base.dao");
const UserDAO = require('../../user/dao/user.dao');

const NotificationEventModel = require("../model/notification-event.model");
const NotificationToUserDAO = require("./notification-to-user.dao");

class NotificationEventDAO extends BaseDAO {
    constructor() {
        super(NotificationEventModel);
    }

    async create(notificationData) {
        const notification = await super.create(notificationData);

        // Promise
        processNotification(notification);

        return notification;
    }

    async getByNamesForToday(names) {
        const nowInLA = moment().tz("America/Los_Angeles");
        const startOfDayDate = nowInLA.clone().startOf('day').toDate();
        const endOfDayDate = nowInLA.clone().endOf('day').toDate();

        return this.all({
            name: {$in: names},
            created_at: {
                $gt: startOfDayDate,
                $lt: endOfDayDate
            }
        });
    }
}

async function processNotification(notification) {
    try {
        if (_.size(notification.recipients.usersTypes)) {
            const users = await UserDAO.getUsersByTypes(notification.recipients.usersTypes);
            await sendToUsers(notification, users);
        } else if (_.size(notification.recipients.usersIds)) {
            const users = await UserDAO.all({_id: {$in: notification.recipients.usersIds}});
            await sendToUsers(notification, users);
        } else {
            notification.status = 'Error';
            await notification.save();
        }
    } catch (error) {
        logger.error(`processNotification(${notification && notification._id}) error ${error}`)

        notification.status = 'Error';
        notification.save();

        throw error;
    }
}

async function sendToUsers(notification, users) {
    const usersWithTokens = _.filter(users, user => user.FCMTokens && user.FCMTokens.length);
    await Promise.map(usersWithTokens, user => NotificationToUserDAO.create(notification, user));

    notification.status = 'Finished';
    await notification.save();
}

module.exports = new NotificationEventDAO();
