'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
    title: {type: String},
    url: {type: String},
    filename: {type: String},
    description: {type: String},
    author: {type: Schema.Types.ObjectId, ref: 'User'},
    DeviceID: {type: Schema.Types.ObjectId, ref: 'Device'},
    EquipmentType: {type: Schema.Types.ObjectId, ref: 'Equipment'},
    DeviceType: {type: Schema.Types.ObjectId, ref: 'EquipmentDevice'},
    ModelNumber: {type: String},
    Status: {type: Number},
    created_at: {type: Date},
    updated_at: {type: Date},
});

const VideoModel = mongoose.model('Video', VideoSchema);

module.exports = VideoModel;
