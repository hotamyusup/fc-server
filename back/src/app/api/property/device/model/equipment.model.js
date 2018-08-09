'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EquipmentDeviceSchema = require("./equipment-device.schema");
const updatedAtValidator = require("../../../../core/validators/updated-at.validator");
const validateUpdatedAt = [updatedAtValidator, 'newer version of entity already stored, updated_at > new value'];

const EquipmentSchema = new Schema({
    updated_at: {type: Date, validate: validateUpdatedAt},
    Title: {type: String},
    Devices: [EquipmentDeviceSchema]
}, {
    usePushEach: true
});

const EquipmentModel = mongoose.model('Equipment', EquipmentSchema);
module.exports = EquipmentModel;
