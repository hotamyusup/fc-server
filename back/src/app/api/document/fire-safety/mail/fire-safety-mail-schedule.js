const Promise = require('bluebird');
const moment = require('moment');
const schedule = require('node-schedule');

const logger = require('../../../../core/logger');
const MailService = require('../../../../core/mail.service');
const DocumentDAO = require('../../common/dao/document.dao.instance');
const documentToMailMessage = require('./documentToMailMessage');

// cron details: https://crontab.guru/#0_09_*_JAN_*
schedule.scheduleJob('0 09 * JAN *', sendNotificationsToAllSigners);
// schedule.scheduleJob('* * * * *', sendNotificationsToAllSigners); // uncomment for testing
// sendNotificationsToAllSigners();

async function sendNotificationsToAllSigners() {
    const isJanuaryNow = moment().month() === 0;


    // uncomment for testing
    // const minMomentOfNotification = moment().add(-5, 'm');
    // const maxMomentOfNotification = minMomentOfNotification.clone().add(1, 'y').month('January').date(31).endOf('day');

    const minMomentOfNotification = isJanuaryNow ? moment().startOf('year') : moment().add(1, 'year').startOf('year');
    const maxMomentOfNotification = minMomentOfNotification.clone().month('January').date(31).endOf('day');
    const today = moment();

    if (today.isAfter(minMomentOfNotification) && today.isBefore(maxMomentOfNotification)) {
        logger.info(`sendNotificationsToAllSigners() Start sending notifications`);

        let lastNotifiedAtDate = minMomentOfNotification.toISOString();

        async function getNextDocuments(count) {
            let nextDocs = await DocumentDAO.getDocumentsBeforeNotifiedAt(lastNotifiedAtDate, count);
            const lastDoc = nextDocs[nextDocs.length - 1];
            if (lastDoc) {
                lastNotifiedAtDate = lastDoc.notified_at;
            }

            return nextDocs || [];
        }

        const nextDocsCount = 20;
        MailService.pool(
            async function getNextMessages() {
                const nextMessages = await getNextDocuments(nextDocsCount);
                logger.info(`getNextMessages() got next ${nextMessages.length} documents`);
                return Promise.map(nextMessages, documentToMailMessage);
            },
            async function onSent(response, message) {
                const {DocumentID} = message;
                if (DocumentID) {
                    const document = await DocumentDAO.get(DocumentID);
                    document.notified_at = moment().toISOString();
                    return document.save();
                }
            });
    } else {
        logger.info(`can't sendNotificationsToAllSigners() minMoment = ${minMomentOfNotification.toISOString()}, maxMoment = ${maxMomentOfNotification.toISOString()}`);
    }
}