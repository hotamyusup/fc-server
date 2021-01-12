'use strict';

const FireSafetyDocumentController = require("../controller/fire-safety.document.controller");

const DOCUMENT_ROUTES = [
    {method: 'GET', path: '/documents/fire-safety', config: FireSafetyDocumentController.getDocument},

    {method: 'POST', path: '/greystar/disclosure409/generate-bulk', config: FireSafetyDocumentController.generateDocumentsGreystar},
    {method: 'POST', path: '/greystar/disclosure409/generate', config: FireSafetyDocumentController.generateDocumentGreystar},

    {method: 'POST', path: '/documents/fire-safety/generate-bulk', config: FireSafetyDocumentController.generateDocuments},
    {method: 'POST', path: '/documents/fire-safety/generate', config: FireSafetyDocumentController.generateDocument},
    {method: 'GET', path: '/documents/fire-safety/{DocumentID}', config: FireSafetyDocumentController.get},
    {method: 'GET', path: '/documents/fire-safety/templatesZip', config: FireSafetyDocumentController.templatesZip},
];

module.exports = DOCUMENT_ROUTES;
