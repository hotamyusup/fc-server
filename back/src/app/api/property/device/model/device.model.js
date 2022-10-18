'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const updatedAtValidator = require("../../../../core/validators/updated-at.validator");
const validateUpdatedAt = [updatedAtValidator, 'newer version of entity already stored, updated_at > new value'];

const DeviceSchema = new Schema({
    EquipmentType: {type: Schema.Types.ObjectId, ref: 'Equipment'},
    DeviceType: {type: Schema.Types.ObjectId, ref: 'EquipmentDevice'},
    ModelNumber: {type: String},
    SerialNumber: {type: String},
    InstallationDate: {type: Date},
    DeviceLocation: {type: String},
    ExpirationType: {type: String},
    PSI: {type: Number},
    Notes: {type: String},
    InUnit: {type: Boolean},
    IsEmergencyExit: {type: Boolean},
    QRCode: {type: String},
    Picture: {type: String},
    XPos: {type: Number},
    YPos: {type: Number},
    AlarmZone: {type: String},
    AlarmStatus: {type: String, default: null},
    // Records: [{type: Schema.Types.ObjectId, ref: 'Inspection'}],
    Status: {type: Number},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, validate: validateUpdatedAt},
    FloorID: {type: Schema.Types.ObjectId, ref: 'Floor'},
    BuildingID: {type: Schema.Types.ObjectId, ref: 'Building'},
    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'}
}, {
    usePushEach: true
});

DeviceSchema.index({PropertyID: 1, BuildingID: 1, FloorID: 1});

const DeviceModel = mongoose.model('Device', DeviceSchema);
module.exports = DeviceModel;
