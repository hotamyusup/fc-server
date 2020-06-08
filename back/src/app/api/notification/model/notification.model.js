'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    User: {type: Schema.Types.ObjectId, ref: 'User'},

    Title: {type: String, required: true},
    Body: {type: String, required: true},
    Icon: {type: String},
    URL: {type: String},
    Read: {type: Boolean, required: true, default: false},

    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'},
    BuildingID: {type: Schema.Types.ObjectId, ref: 'Building'},
    FloorID: {type: Schema.Types.ObjectId, ref: 'Floor'},
    DeviceID: {type: Schema.Types.ObjectId, ref: 'Device'},
    InspectionID: {type: Schema.Types.ObjectId, ref: 'Inspection'},

    created_at: {type: Date, default: Date.now},
});

const NotificationModel = mongoose.model('Notification', NotificationSchema);

module.exports = NotificationModel;
