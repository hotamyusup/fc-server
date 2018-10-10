'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MapSchema = new Schema({
    Image: {type: String},
    Scale: {type: Number},
    Left: {type: Number},
    Px: {type: Number},
    Py: {type: Number},
    Top: {type: Number}
});

module.exports = MapSchema;
