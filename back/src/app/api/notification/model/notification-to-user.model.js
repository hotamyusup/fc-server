'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationToUserSchema = new Schema({
    notificationEvent: {type: Schema.Types.ObjectId, ref: 'NotificationEvent', required: true},
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    read: {type: Boolean, required: true, default: false},
    created_at: {type: Date, default: Date.now},
});

const NotificationToUserModel = mongoose.model('NotificationToUser', NotificationToUserSchema);

module.exports = NotificationToUserModel;
