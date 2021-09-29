'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const updatedAtValidator = require("../../../core/validators/updated-at.validator");
const validateUpdatedAt = [updatedAtValidator, 'newer version of entity already stored, updated_at > new value'];

const InternalInventorySchema = new Schema({
    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'},
    EquipmentTypeID: {type: Schema.Types.ObjectId, ref: 'Equipment'},
    DeviceTypeID: {type: Schema.Types.ObjectId, ref: 'EquipmentDevice'},
    ModelNumber: {type: String},
    SerialNumber: {type: String},
    QRCode: {type: String},
    Picture: {type: String},
    Status: {type: Number},
    ReservedToID: {type: Schema.Types.ObjectId, ref: 'User'},
    ReservedAt: {type: Date},
    Notes: {type: String},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, validate: validateUpdatedAt},
}, {
    usePushEach: true
});

const InternalInventoryModel = mongoose.model('InternalInventory', InternalInventorySchema);

module.exports = InternalInventoryModel;