const DocumentHistoryDAO = require('./document-history.dao');
const DocumentHistoryModel = require('../model/document-history.model');

module.exports = new DocumentHistoryDAO(DocumentHistoryModel);

