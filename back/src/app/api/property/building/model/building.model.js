'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MapSchema = require("../../common/map/model/map.schema");

const BuildingSchema = new Schema({
    Title: {type: String},
    Map: MapSchema,
    XPos: {type: Number},
    YPos: {type: Number},
    Picture: {type: String},
    // Floors: [{ type: Schema.Types.ObjectId, ref: 'Floor' }],
    Status: {type: Number},
    created_at: {type: Date},
    updated_at: {type: Date},
    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'}
}, {
    usePushEach: true
});

BuildingSchema.index({PropertyID: 1});

const BuildingModel = mongoose.model('Building', BuildingSchema);
module.exports = BuildingModel;
