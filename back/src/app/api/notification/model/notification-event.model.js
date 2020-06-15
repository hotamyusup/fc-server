'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationEventSchema = new Schema({
    name: String,
    recipients: {
        usersTypes: Object,
        usersIds: Object
    },
    status: {type: String, required: true, default: 'Pending'}, // 'Pending', 'Finished', 'Error'
    data: {
        title: {type: String},
        body: {type: String},
        icon: {type: String},
        url: {type: String},
        progress: {type: String},
        PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'},
        BuildingID: {type: Schema.Types.ObjectId, ref: 'Building'},
        FloorID: {type: Schema.Types.ObjectId, ref: 'Floor'},
        DeviceID: {type: Schema.Types.ObjectId, ref: 'Device'},
        InspectionID: {type: Schema.Types.ObjectId, ref: 'Inspection'},
    },
    created_at: {type: Date, default: Date.now},
});

const NotificationEventModel = mongoose.model('NotificationEvent', NotificationEventSchema);

module.exports = NotificationEventModel;
