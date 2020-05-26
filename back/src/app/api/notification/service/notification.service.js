'use strict';

const _ = require('underscore');
const admin = require('firebase-admin');
const logger = require('../../../core/logger');
const config = require('../../../../config/config');
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
     * @param userID
     * @param data {title, body, icon, url}
     * @returns {Promise<void>}
     */
    async notify(userID, data = {}) {
        const user = await UserDAO.get(userID);

        try {
            if (!user) {
                throw new Error(`User with id === ${userID} not found`);
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
