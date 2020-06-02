'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MapSchema = require("../../common/map/model/map.schema");

const updatedAtValidator = require("../../../../core/validators/updated-at.validator");
const validateUpdatedAt = [updatedAtValidator, 'newer version of entity already stored, updated_at > new value'];

const BuildingSchema = new Schema({
    Title: {type: String},
    Map: MapSchema,
    XPos: {type: Number},
    YPos: {type: Number},
    Picture: {type: String},
    // Floors: [{ type: Schema.Types.ObjectId, ref: 'Floor' }],
    Status: {type: Number},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, validate: validateUpdatedAt},
    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'}
}, {
    usePushEach: true
});

BuildingSchema.index({PropertyID: 1});

const BuildingModel = mongoose.model('Building', BuildingSchema);
module.exports = BuildingModel;
