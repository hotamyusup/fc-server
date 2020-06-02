'use strict';

const _ = require('underscore');
const Promise = require('bluebird');
const admin = require('firebase-admin');

const config = require('../../../../config/config');
const logger = require('../../../core/logger');

const UserDAO = require('../../user/dao/user.dao');
const NotificationDAO = require('../dao/notification.dao');

admin.initializeApp({
    credential: admin.credential.cert(config.firebase.serviceAccount),
    databaseURL: config.firebase.databaseURL
});

const fcm = admin.messaging();

class NotificationService {
    constructor() {
    }

    /**
     *
     * @param usersType Admin | Employee | Customer
     * @param data {title, body, icon, url}
     * @returns {Promise<void>}
     */
    async notifyUsersByType(usersTypes, data = {}) {
        if (_.isString(usersTypes)) {
            usersTypes = [usersTypes];
        }

        const users = await UserDAO.getUsersByTypes(usersTypes);
        const usersWithTokens = _.filter(users, user => user.FCMTokens && user.FCMTokens.length);
        return Promise.map(usersWithTokens, user => this.notify(user, data));
    }

    /**
     *
     * @param userID
     * @param data {title, body, icon, url}
     * @returns {Promise<void>}
     */
    async notifyUserByID(userID, data = {}) {
        const user = await UserDAO.get(userID);
        return this.notify(user, data);
    }

    /**
     *
     * @param user
     * @param data {title, body, icon, url}
     * @returns {Promise<void>}
     */
    async notify(user, data = {}) {
        const dataLogString = `{title: ${data.title}, body: ${data.body}`.substr(0, 200) + '}';
        logger.info(`NotificationService.notify(${user && user._id}, ${dataLogString})`);
        try {
            if (!user) {
                logger.error(`NotificationService.notify(${user && user._id}, ${dataLogString}) user is undefined`);
                throw new Error(`NotificationService.notify() user is undefined `);
            } else {
                const notification = await NotificationDAO.create({
                    User: user,
                    Title: data.title,
                    Body: data.body,
                    Icon: data.icon,
                    URL: data.url,
                    created_at: new Date()
                });

                const messageData = {...data}
                if (data.url) {
                    messageData.data = data.url;
                    delete messageData.url;
                } else {
                    const url = `${config.server.url}/admin/notifications/show.html?id=${notification.id}`;
                    messageData.data = url;
                    notification.URL = url;
                    await notification.save();
                }

                const userFCMTokens = _.map(user.FCMTokens, ({Token}) => Token);
                if (userFCMTokens.length) {
                    const message = {data: messageData, tokens: userFCMTokens};
                    logger.info(`NotificationService.notify(${user._id}, ${dataLogString}) sendMulticast()`);

                    await fcm.sendMulticast(message);
                }
            }
        } catch (error) {
            logger.error(`NotificationService.notify ${userID}, data = ${JSON.stringify(data)}) error: ${error}`);
            throw error;
        }
    }
}

module.exports = new NotificationService();
