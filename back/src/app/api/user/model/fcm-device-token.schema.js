'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FCMDeviceTokenSchema = new Schema({
    UserAgent: {type: String},
    Token: {type: String},
    created_at: {type: Date}
}, {
    usePushEach: true
});

module.exports = FCMDeviceTokenSchema;
