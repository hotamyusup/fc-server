'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentSchema = new Schema({
    type: {type: String}, // e.g. 'fire-safety-disclosure'
    Status: {type: Number},
    title: {type: String},
    definition: {type: Schema.Types.Object}, // document definition for pdfmake
    options: {type: Schema.Types.Object}, // owner email, to notify, etc.
    signer: {type: Schema.Types.Object}, // tenant
    signed_at: {type: Date},
    created_at: {type: Date},
    updated_at: {type: Date},
    notified_at: {type: Date},
    PropertyID: {type: Schema.Types.ObjectId, ref: 'Property'},
    BuildingID: {type: Schema.Types.ObjectId, ref: 'Building'},
    FloorID: {type: Schema.Types.ObjectId, ref: 'Floor'},
});

DocumentSchema.index({notified_at: 1});

const DocumentModel = mongoose.model('Document', DocumentSchema);

module.exports = DocumentModel;