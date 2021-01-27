const BouncedMailDAO = require('./bounced-mail.dao');
const BouncedMailModel = require('../model/bounced-mail.model');

module.exports = new BouncedMailDAO(BouncedMailModel);

