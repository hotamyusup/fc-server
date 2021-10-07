'use strict';

const mongoose = require('mongoose');
const DocumentSchema = require('./document.schema');
const Schema = mongoose.Schema;

const DocumentHistorySchema = new Schema({
    DocumentID: {type: Schema.Types.ObjectId, ref: 'Document'},
    document: DocumentSchema,
    created_at: {type: Date, default: Date.now},
});

const DocumentHistoryModel = mongoose.model('DocumentHistory', DocumentHistorySchema);

module.exports = DocumentHistoryModel;
