const schedule = require('node-schedule');
const client = require('@sendgrid/client');

const {onDBConnected} = require('../../../../../config/db');
const config = require('../../../../../config/config');
const logger = require('../../../../core/logger');

const SendGridService = require('../../common/service/sendgrid.service');


client.setApiKey(config.sendgrid.apiKey);

// cron details: https://crontab.guru/#10,40_*_*_JAN_*
schedule.scheduleJob('10,40 * * JAN *', fetchBouncesFromSendGridJob);

// cron details: https://crontab.guru/#0_11_*_*_*
schedule.scheduleJob('0 11 * * *', fetchBouncesFromSendGridJob);

// for testing
// schedule.scheduleJob('*/15 * * * *', fetchBouncesFromSendGridJob);


async function fetchBouncesFromSendGridJob() {
    try {
        await onDBConnected;

        logger.info(`fetchBouncesFromSendGridJob()`);

        SendGridService.fetchNewBouncesFromSendGridDebounced();

    } catch (error) {
        logger.error(`fetchBouncesFromSendGridJob() error === ${error}`);
    }
}

// fetchBouncesFromSendGridJob();
