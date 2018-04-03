'use strict';

const mongoose = require('mongoose');
const schema = mongoose.Schema;

const ConstructionTypeSchema = new schema({
    ConstructionTypeID: {type: Number},
    Title: {type: String, required: true}
});

const ConstructionTypeModel = mongoose.model('ConstructionType', ConstructionTypeSchema);
module.exports = ConstructionTypeModel;


