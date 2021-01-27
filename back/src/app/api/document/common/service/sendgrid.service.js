'use strict';

const _ = require("lodash");
const Promise = require('bluebird');
const client = require('@sendgrid/client');

const config = require('../../../../../config/config');
const logger = require('../../../../core/logger');

const BouncedMailDAO = require('../../common/dao/bounced-mail.dao.instance');
const NotificationEventDAO = require('../../../notification/dao/notification-event.dao');

client.setApiKey(config.sendgrid.apiKey);

class SendGridService {

    fetchNewBouncesFromSendGridDebounced() {
        logger.info(`SendGridService.fetchNewBouncesFromSendGridDebounced() attach`);

        if (!this._debounced) {
            this._debounced = _.debounce(() => {
                logger.info(`SendGridService.fetchNewBouncesFromSendGridDebounced() run`);
                this._debounced = null;
                this.fetchNewBouncesFromSendGrid();
            }, 1000 * 60 * 3);
        }

        this._debounced();
    }

    async fetchNewBouncesFromSendGrid() {
        try {
            logger.info(`SendGridService.fetchNewBouncesFromSendGrid() start`);

            const queryParams = {};

            const lastCreated = await BouncedMailDAO.lastCreated();
            if (lastCreated) {
                queryParams.start_time = lastCreated + 1;
            }

            const newBounces = await this.fetchBouncesFromSendGrid(queryParams);

            if (newBounces.length > 0) {
                logger.info(`SendGridService.fetchNewBouncesFromSendGrid() Found ${newBounces.length} bounced mails`);
                const bouncedMailsString = _.map(newBounces, ({email}) => email).join(', ');
                const notificationEvent = await NotificationEventDAO.create({
                    name: 'new:bounced:mail:success',
                    recipients: {usersTypes: ['Admin']},
                    data: {
                        title: `${newBounces.length} new bounced mail${newBounces.length > 1 ? 's' : ''}!`,
                        body: `A bounced mail is when the message is undeliverable and then returned to the server that sent it.\
                         Bounced mail${newBounces.length > 1 ? 's' : ''}: ${bouncedMailsString.length > 800 ? bouncedMailsString.substr(0, 800).concat('...') : bouncedMailsString}`,
                    }
                });

                logger.info(`SendGridService.fetchNewBouncesFromSendGrid() created notificationEvent ${notificationEvent._id}`);
            }

            return newBounces
        } catch (error) {
            logger.error(`SendGridService.fetchNewBouncesFromSendGrid() error === ${error}`)
        }
    }

    /**
     * @param queryParams {start_time, end_time}
     * @returns Promise<>
     */
    async fetchBouncesFromSendGrid(queryParams = {}) {
        try {
            const request = {
                url: '/v3/suppression/bounces',
                method: 'GET',
                qs: queryParams,
            }

            const [response, bounces] = await client.request(request);

            if (response.statusCode === 200) {
                const createBounceModel = bounceDTO => BouncedMailDAO.upsert(bounceDTO);
                const savedBounces = await Promise.map(bounces, createBounceModel, {concurrency: 10});

                return savedBounces;
            }

        } catch (error) {
            logger.error(`SendGridService.fetchBouncesFromSendGrid() error = ${error}`)
        }
    }

}

module.exports = new SendGridService();