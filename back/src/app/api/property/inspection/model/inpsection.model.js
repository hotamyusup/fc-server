'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PhotoSchema = require("./photo.schema");

const InspectionSchema = new Schema({
    Frequency: {type: String},
    DeviceStatus: {type: Number},
    Reason: {type: String},
    Note: {type: String},
    InspectionDate: {type: Date},
    Status: {type: Number},
    User: {type: String},
    Photos: [PhotoSchema],
    created_at: {type: Date},
    updated_at: {type: Date}
});

const InspectionModel = mongoose.model('Inspections', InspectionSchema);
module.exports = InspectionModel;
