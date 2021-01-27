'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BouncedMailSchema = new Schema({
    // SendGrid columns ----- start
    created: {type: Number},
    email: {type: String},
    reason: {type: String},
    status: {type: String},
    // SendGrid columns ----- end
});

BouncedMailSchema.index({email: 1}, {unique: true});

const BouncedMailModel = mongoose.model('BouncedMail', BouncedMailSchema);

module.exports = BouncedMailModel;

// const exampleBouncedMail = {
//     created: 1611677913,
//     email: 'not.exists.mail.222222@gmail.com',
//     reason: '550 5.1.1 The email account that you tried to reach does not exist. Please try double-checking the recipient\'s email address for typos or unnecessary spaces. Learn more at https://support.google.com/mail/?p=NoSuchUser l13si876014ejg.426 - gsmtp',
//     status: '5.1.1'
// }