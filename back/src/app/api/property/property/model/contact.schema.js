'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
    Title: {type: String},
    Email: {type: String},
    Phone: {type: String}
});

module.exports = ContactSchema;
