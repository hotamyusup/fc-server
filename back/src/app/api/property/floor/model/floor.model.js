'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MapSchema = require("../../common/map/model/map.schema");

const FloorSchema = new Schema({
    Title: {type: String},
    Map: MapSchema,
    XPos: {type: Number},
    YPos: {type: Number},
    Devices: [{ type: Schema.Types.ObjectId, ref: 'Device'}],
    Status: {type: Number},
    created_at: {type: Date},
    updated_at: {type: Date}
}, {
    usePushEach: true
});

const FloorModel = mongoose.model('Floor', FloorSchema);
module.exports = FloorModel;
