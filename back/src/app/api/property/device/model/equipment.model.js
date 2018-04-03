'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeviceSchema = new Schema({
    Title: {type: String},
    Color:{type:String},
    Status:{type: Number}
}, {
  usePushEach: true
});

const EquipmentSchema = new Schema({
    Title: {type: String},
    Devices: [DeviceSchema]
}, {
  usePushEach: true
});


module.exports = {
    EquipmentModel : mongoose.model('Equipments', EquipmentSchema),
    EquipmentDeviceModel: mongoose.model('EquipmentDevices', DeviceSchema)
};
