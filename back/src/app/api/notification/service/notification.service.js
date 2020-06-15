'use strict';

const _ = require('underscore');
const Promise = require('bluebird');
const admin = require('firebase-admin');

const config = require('../../../../config/config');
const logger = require('../../../core/logger');

admin.initializeApp({
    credential: admin.credential.cert(config.firebase.serviceAccount),
    databaseURL: config.firebase.databaseURL
});

const fcm = admin.messaging();

class NotificationService {
    constructor() {
    }

    /**
     * @param user
     * @param data {title, body, icon, url}
     * @returns {Promise<void>}
     */
    async notify(user, data) {
        const dataLogString = `{title: ${data && data.title}, body: ${data && data.body}`.substr(0, 200) + '}';
        logger.info(`NotificationService.notify(${user && user._id}, ${dataLogString})`);
        try {
            if (!user) {
                logger.error(`NotificationService.notify(${user && user._id}, ${dataLogString}) user is undefined`);
                throw new Error(`NotificationService.notify() user is undefined `);
            } else if (!data) {
                logger.error(`NotificationService.notify(${user && user._id}, ${dataLogString}) data is undefined`);
                throw new Error(`NotificationService.notify() data is undefined `);
            } else {
                data = JSON.parse(JSON.stringify(data));

                if (data.url) {
                    data.data = data.url;
                    delete data.url;
                }

                const userFCMTokens = _.map(user.FCMTokens, ({Token}) => Token);
                if (userFCMTokens.length) {
                    const message = {data: data, tokens: userFCMTokens};
                    logger.info(`NotificationService.notify(${user._id}, ${dataLogString}) sendMulticast()`);
                    await fcm.sendMulticast(message);
                }
            }
        } catch (error) {
            logger.error(`NotificationService.notify((${user && user._id}, ${JSON.stringify(data)}) error: ${error}`);
            throw error;
        }
    }
}

module.exports = new NotificationService();
