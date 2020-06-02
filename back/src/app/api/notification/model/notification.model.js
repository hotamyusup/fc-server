'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    User: {type: Schema.Types.ObjectId, ref: 'Property'},
    Title: {type: String, required: true},
    Body: {type: String, required: true},
    Icon: {type: String},
    URL: {type: String},
    Read: {type: Boolean, required: true, default: false},
    created_at: {type: Date, default: Date.now},
});

const NotificationModel = mongoose.model('Notification', NotificationSchema);

module.exports = NotificationModel;
