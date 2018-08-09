'use strict';

var nodemailer = require('nodemailer');

class MailService {
    send(to, subject, html, attachments) {
        const name = 'FireCloud';
        const from = 'noreply_firecloud@fireprotected.com';

        const smtpTransport = nodemailer.createTransport({
	    host: 'smtp.sendgrid.net',
	    port: 2525,
	    auth: {
		user: 'apikey',
		pass: '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'
            },
        });

        const mailOptions = {from, to, subject, html, attachments};

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



