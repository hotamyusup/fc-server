const Promise = require('bluebird');

const Boom = require('boom');
const nodemailer = require('nodemailer');

const MailService = require('../../../core/mail.service');
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
                const password = generatePassword(6);
                const email = request.payload.Email;

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

                    return MailService.sendMessage(mailOptions);
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

function generatePassword(length = 6) {
    const CHARSET = ""
            + "abcdefghijklmnopqrstuvwxyz"
            + // "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "0123456789"
            // + "_"
        ;
    let randomChars = "";

    for (let i = 0; i < length; ++i) {
        randomChars += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
    }

    return randomChars;
}

module.exports = new PasswordController();
