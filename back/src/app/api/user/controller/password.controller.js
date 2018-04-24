const Promise = require('bluebird');

const Boom = require('boom');
const nodemailer = require('nodemailer');

const logger = require('../../../core/logger');
const UserDAO = require("../dao/user.dao");

class PasswordController {
    get reset() {
        return {
            auth: false,
            handler: function (request, reply) {
                logger.info(`PasswordController.reset start ${request.payload.Email}`);
                if (request.payload.Email == '') {
                    return reply('0');
                }

                const name = 'FireCloud System';
                const from = 'noreply_firecloud@fireprotected.com';
                const password = Math.floor(Math.random() * (99999 - 11111)) + 11111;
                const email = request.payload.Email;
                const smtpTransport = nodemailer.createTransport({
		    host: 'smtp.sendgrid.net',
		    port: 2525,
		    auth: {
			user: 'apikey',
			pass: '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'
		    },
                });

                logger.info(`smtp settings ${smtpTransport} `);

                const resetPasswordForUserEntity = () => UserDAO
                    .findUserByEmail(email)
                    .then((user) => {
                        if (user) {
                            user.Password = password;
                            return UserDAO.update(user);
                        } else {
                            throw new Error('user not found');
                        }
                    });

                const notifyUserByEmail = () => {
                    const mailOptions = {
                        from: from,
                        to: email,
                        subject: 'Password Reqest',
                        html: `
                            <b>Your password has been reset. Please login using new password.</b>
                            <br/><br/>
                            <b>E-mail:</b>${email}
                            <br/>
                            <b>Password:</b> ${password}`
                    };

                    return new Promise((resolve, reject) => {
                        smtpTransport.sendMail(mailOptions, function (error, response) {
                            if (error) {
                                return reject(error);
                            } else {
                                return resolve();
                            }
                        });
                    });
                };

                resetPasswordForUserEntity()
                    .then(notifyUserByEmail)
                    .then(() => {
                        logger.info(`PasswordController.reset ${request.payload.Email} success.`);
                        reply('{}');
                    })
                    .catch(err => {
                        logger.error(`PasswordController.reset ${request.payload.Email} error.${err}`);
                        if (err.message === 'user not found') {
                            reply('0');
                        } else if (11000 === err.code || 11001 === err.code) {
                            return reply(
                                Boom.forbidden('please provide another id, it already exist')
                            );
                        } else {
                            return reply(Boom.forbidden(err)); // HTTP 403
                        }
                    });
            },
        };
    }
}

module.exports = new PasswordController();
