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
    Floors: [{ type: Schema.Types.ObjectId, ref: 'Floor' }],
    Status: {type: Number},
    created_at: {type: Date},
    updated_at: {type: Date}
}, {
    usePushEach: true
});

const BuildingModel = mongoose.model('Buildings', BuildingSchema);
module.exports = BuildingModel;
