'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EquipmentDeviceSchema = new Schema({
    Title: {type: String},
    Color: {type: String},
    Status: {type: Number}
}, {
    usePushEach: true
});

// const EquipmentDeviceModel = mongoose.model('EquipmentDevice', EquipmentDeviceSchema);
module.exports = EquipmentDeviceSchema;
