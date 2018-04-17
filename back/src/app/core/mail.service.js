'use strict';

var nodemailer = require('nodemailer');

class MailService {
    send(to, subject, html) {
        const name = 'Fire Cloud';
        const from = 'fireclouddigitalocean@gmail.com';

        const smtpTransport = nodemailer.createTransport({
            service: 'Gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: 'fireclouddigitalocean@gmail.com',
                pass: 'Fc161020',
            },
        });

        const mailOptions = {from, to, subject, html};

        return new Promise((resolve, reject) => {
            smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                    return reject(error);
                } else {
                    return resolve(response);
                }
            });
        });
    }
}

module.exports = new MailService();



