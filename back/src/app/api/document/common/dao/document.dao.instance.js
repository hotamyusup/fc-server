const DocumentDAO = require('./document.dao');
const DocumentModel = require('../model/document.model');

module.exports = new DocumentDAO(DocumentModel);

