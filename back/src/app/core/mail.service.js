'use strict';

var nodemailer = require('nodemailer');

class MailService {
    send(to, subject, html) {
        const name = 'FireCloud';
        const from = 'noreply_firecloud@fireprotected.com';

        const smtpTransport = nodemailer.createTransport({
	    service: 'SendGrid',
	    host: 'smtp.sendgrid.net',
	    auth: {
		//user: 'firecloud_smtp@fireprotected.com',
	       //pass: 'Poh23320',
		//user: 'fireclouddigitalocean@gmail.com',
		//pass: 'Fc161020',
		user: 'apikey',
		pass: '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',
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



