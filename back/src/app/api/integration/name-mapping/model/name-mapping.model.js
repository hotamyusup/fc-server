'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const updatedAtValidator = require("../../../../core/validators/updated-at.validator");
const validateUpdatedAt = [updatedAtValidator, 'newer version of entity already stored, updated_at > new value'];

const NameMappingSchema = new Schema({
    // EntityType: {type: String}, // ['Property', 'Building', 'Floor']
    // ExternalName: {type: String},
    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'},
    BuildingID: {type: Schema.Types.ObjectId, ref: 'Building'},
    FloorID: {type: Schema.Types.ObjectId, ref: 'Floor'},
    Unit: {type: String},
    ImportData: {type: Schema.Types.Object},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, validate: validateUpdatedAt},
}, {
    usePushEach: true
});

const NameMappingModel = mongoose.model('NameMapping', NameMappingSchema);

module.exports = NameMappingModel;