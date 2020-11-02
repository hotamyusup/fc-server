'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = require("./contact.schema");
const MapImageSchema = require("../../common/map/model/map-image.schema");

const updatedAtValidator = require("../../../../core/validators/updated-at.validator");
const validateUpdatedAt = [updatedAtValidator, 'newer version of entity already stored, updated_at > new value'];

const PropertySchema = new Schema({
    Title: {type: String},
    Street: {type: String},
    City: {type: String},
    State: {type: String},
    ZipCode: {type: String},
    OccupancyUse: {type: Schema.Types.ObjectId, ref: 'OccupancyType'},
    ConstructionType: {type: Schema.Types.ObjectId, ref: 'ConstructionType'},
    Stories: {type: String},
    YearConstructed: {type: String},
    Organization: {type: Schema.Types.ObjectId, ref: 'Organization'},
    Client: {type: String},
    PropertyManager: {type: Schema.Types.ObjectId, ref: 'User'},
    QRCode: {type: String},
    Map: {type: String}, // @deprecated
    MapImage: {type: MapImageSchema},
    Picture: {type: String},
    Pictures: [String],
    // Buildings: [{type: Schema.Types.ObjectId, ref: 'Building'}],
    Contacts: [ContactSchema],
    Latitude: {type: String},
    Longitude: {type: String},
    AddDate: {type: Date},
    UpdateDate: {type: Date},
    Status: {type: Number},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, validate: validateUpdatedAt},
}, {
    usePushEach: true
});

const PropertyModel = mongoose.model('Property', PropertySchema);
module.exports = PropertyModel;
