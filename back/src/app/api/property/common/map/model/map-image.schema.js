'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MapImageSchema = new Schema({
    image: {type: String},
    zoomLevel: {type: Number},
    direction: {type: Number},
    pitch: {type: Number},
    coordinates: Object,
});

module.exports = MapImageSchema;
