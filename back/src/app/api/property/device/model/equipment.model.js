'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EquipmentDeviceSchema = require("./equipment-device.model").schema;

const EquipmentSchema = new Schema({
    Title: {type: String},
    Devices: [EquipmentDeviceSchema]
}, {
    usePushEach: true
});

const EquipmentModel = mongoose.model('Equipment', EquipmentSchema);
module.exports = EquipmentModel;
