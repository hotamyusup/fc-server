'use strict';

// const BaseDAO = require("../../../../core/base.dao");
const DocumentModel = require("../../common/model/document.model");
const DocumentDAO = require("../../common/dao/document.dao");

const FireSafetyDocumentDAOInstance = new DocumentDAO(DocumentModel);
module.exports = FireSafetyDocumentDAOInstance;

