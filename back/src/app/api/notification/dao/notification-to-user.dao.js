'use strict';
const Promise = require('bluebird');
const _ = require('lodash');

const config = require('../../../../config/config');
const logger = require('../../../core/logger');
const BaseDAO = require("../../../core/base.dao");

const NotificationService = require('../service/notification.service');
const NotificationToUserModel = require("../model/notification-to-user.model");

class NotificationToUserDAO extends BaseDAO {
    constructor() {
        super(NotificationToUserModel);
    }

    async all(conditions, options) {
        conditions = conditions || {};
        return this.model
            .find(conditions, null, options)
            .populate("notificationEvent")
    }

    async get(id) {
        return this.model
            .findOne({_id: id})
            .populate("notificationEvent")
    }

    async create(notification, user) {
        const notificationToUser = await super.create({
            notificationEvent: notification,
            user: user,
            created_at: new Date()
        });

        // Promise
        this.sendNotificationToUser(notificationToUser, notification, user);

        return notificationToUser;
    }

    async sendNotificationToUser(notificationToUser, notification, user) {
        const data = {...notification.data};
        if (!user || !user._id || !notification || !data) {
            const errorMsg = `NotificationToUserDAO.sendNotificationToUser() error !user:${!user} || !notification: ${!notification}`;
            logger.error(errorMsg);
            throw new Error(errorMsg)
        }

        if (!data.url && !data.data) {
            data.data = `${config.server.url}/admin/notifications/show.html?id=${notificationToUser.id}`;
        }

        await NotificationService.notify(notificationToUser.user, data);
    }

    async markAllRead(userID) {
        return NotificationToUserModel.updateMany({user: userID, read: false}, {$set: {read: true}});
    }
}

module.exports = new NotificationToUserDAO();
