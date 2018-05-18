'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeviceSchema = new Schema({
    EquipmentType: {type: Schema.Types.ObjectId, ref: 'Equipment'},
    DeviceType: {type: Schema.Types.ObjectId, ref: 'EquipmentDevice'},
    ModelNumber: {type: String},
    SerialNumber: {type: String},
    InstallationDate: {type: Date},
    DeviceLocation: {type: String},
    ExpirationType: {type: String},
    Notes: {type: String},
    QRCode: {type: String},
    Picture: {type: String},
    XPos: {type: Number},
    YPos: {type: Number},
    // Records: [{type: Schema.Types.ObjectId, ref: 'Inspection'}],
    Status: {type: Number},
    created_at: {type: Date},
    updated_at: {type: Date},
    FloorID: {type: Schema.Types.ObjectId, ref: 'Floor'},
    BuildingID: {type: Schema.Types.ObjectId, ref: 'Building'},
    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'}
}, {
    usePushEach: true
});

DeviceSchema.index({PropertyID: 1, BuildingID: 1, FloorID: 1});

const DeviceModel = mongoose.model('Device', DeviceSchema);
module.exports = DeviceModel;
