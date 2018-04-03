'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = require("./contact.schema");

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
    Organization: {type: String},
    Client: {type: String},
    PropertyManager: {type: String},
    QRCode: {type: String},
    Map: {type: String},
    Picture: {type: String},
    Buildings: [{type: Schema.Types.ObjectId, ref: 'Building'}],
    Contacts: [ContactSchema],
    Latitude: {type: String},
    Longitude: {type: String},
    AddDate: {type: Date},
    UpdateDate: {type: Date},
    Status: {type: Number},
    created_at: {type: Date},
    updated_at: {type: Date}
}, {
    usePushEach: true
});

const PropertyModel = mongoose.model('Property', PropertySchema);
module.exports = PropertyModel;
