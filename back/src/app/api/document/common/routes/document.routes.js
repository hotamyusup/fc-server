'use strict';

const DocumentController = require("../controller/document.controller");

const DOCUMENT_ROUTES = [
    {method: 'POST', path: '/documents/batch', config: DocumentController.batch},
    {method: 'POST', path: '/documents/rebuild', config: DocumentController.rebuild},
    {method: 'POST', path: '/documents/notify-batch', config: DocumentController.notifyOnEmailBatch},
    {method: 'POST', path: '/documents/{DocumentID}/sign', config: DocumentController.sign},
    {method: 'POST', path: '/documents/documentsZip', config: DocumentController.documentsZip},
    {method: 'POST', path: '/documents/documentsCSV', config: DocumentController.documentsCSV},
    {method: 'GET', path: '/documents/{DocumentID}/activate', config: DocumentController.activate},
    {method: 'GET', path: '/documents/{DocumentID}/deactivate', config: DocumentController.deactivate},
    {method: 'GET', path: '/documents/{DocumentID}/notify', config: DocumentController.notifyOnEmail},
    {method: 'GET', path: '/documents/{DocumentID}.{format}', config: DocumentController.getFormatted},
    {method: 'DELETE', path: '/documents/{DocumentID}.{format}', config: DocumentController.delete},
    {method: 'GET', path: '/documents', config: DocumentController.getForProperty},
];

module.exports = DOCUMENT_ROUTES;
