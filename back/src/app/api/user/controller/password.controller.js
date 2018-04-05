const Boom = require('boom');
const UserDAO = require("../dao/user.dao");
const nodemailer = require('nodemailer');

class PasswordController {
    get reset() {
        return {
            auth: false,
            handler: function (request, reply) {
                if (request.payload.Email == '') {
                    return reply('0');
                }

                var name = 'Fire Cloud';
                var from = 'fireclouddigitalocean@gmail.com';
                var password = Math.floor(Math.random() * (99999 - 11111)) + 11111;
                var email = request.payload.Email;
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    host: 'smtp.gmail.com',
                    auth: {
                        user: 'fireclouddigitalocean@gmail.com',
                        pass: 'Fc161020',
                    },
                });

                User.findOne({Email: request.payload.Email}, function (err, user) {
                    if (user) {
                        user.Password = password;
                        user.save(function (err, user) {
                            if (!err) {
                                return reply('1');
                            }
                            if (11000 === err.code || 11001 === err.code) {
                                return reply(
                                    Boom.forbidden('please provide another id, it already exist')
                                );
                            }
                            return reply(Boom.forbidden(err)); // HTTP 403
                        });
                    } else {
                        return reply('0');
                    }
                });

                var mailOptions = {
                    from: from,
                    to: email,
                    subject: 'Password Reqest',
                    html: '<b>Your password has been reset. Please login using new password.</b><br /><br /><b>E-mail:</b> ' +
                    email +
                    '<br><b>Password:</b> ' +
                    password,
                };

                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        return reply(error);
                    } else {
                        return reply('{}');
                    }
                });
            },
        };
    }
}

module.exports = new PasswordController();
