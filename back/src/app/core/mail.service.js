'use strict';

const nodemailer = require('nodemailer');
const logger = require('./logger');
const config = require('../../config/config');

const getMailConfig = () => config.NODE_ENV === 'production'
    ? {
        host: 'smtp.sendgrid.net',
        port: 2525,
        auth: {
            user: 'apikey',
            pass: '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'
        },
    }
    : {
        // sent test mails here: https://ethereal.email/login
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'yihz3yz2g3dh2blk@ethereal.email',
            pass: 'TFknB88xyDx2UBDzQF'
        }
    };

const smtpTransport = nodemailer.createTransport(getMailConfig());
const pooledSmtpTransport = (() => {
    const mailConfig = getMailConfig();
    mailConfig.pool = true;
    return nodemailer.createTransport(mailConfig);
})();

const sendMailPromisified = function (transporter, message) {
    return new Promise((resolve, reject) => {
        logger.info(`Start: Send mail to ${message.to} "${message.subject}"`);
        transporter.sendMail(message, function (error, response) {
            if (error) {
                logger.error(`Error: Send mail to ${message.to} "${message.subject}" failed`);
                return reject(error);
            } else {
                logger.info(`Success: Send mail to ${message.to} "${message.subject}" success`);
                return resolve(response);
            }
        });
    });
};

class MailService {
    send(to, subject, html, attachments) {
        const name = 'FireCloud';
        const from = 'noreply_firecloud@fireprotected.com';
        const message = {from, to, subject, html, attachments};
        return sendMailPromisified(smtpTransport, message);
    }

    /**
     * @param getNextMessages callback Array [{from, to, subject, html, attachments}, ...]
     * @returns {Promise}
     */
    // pool(messages) {
    pool(getNextMessages) {
        let messages = [];

        return new Promise((resolve, reject) => {
            const flush = async() => {
                while (pooledSmtpTransport.isIdle() && messages.length) {
                    const message = messages.shift();
                    sendMailPromisified(pooledSmtpTransport, message);
                }

                if (messages.length === 0) {
                    messages = await getNextMessages();
                    if (messages.length === 0) {
                        resolve();
                    } else {
                        setTimeout(flush, 1000);
                    }
                }
            };
            pooledSmtpTransport.on('idle', flush);
            flush();
        });
    }
}

module.exports = new MailService();



