'use strict';

const DocumentController = require("../controller/document.controller");

const DOCUMENT_ROUTES = [
    {method: 'POST', path: '/documents/{DocumentID}/sign', config: DocumentController.sign},
    {method: 'GET', path: '/documents/{DocumentID}/activate', config: DocumentController.activate},
    {method: 'GET', path: '/documents/{DocumentID}/deactivate', config: DocumentController.deactivate},
    {method: 'GET', path: '/documents/{DocumentID}/notify', config: DocumentController.notifyOnEmail},
    {method: 'GET', path: '/documents/{DocumentID}.{format}', config: DocumentController.getFormatted},
    {method: 'GET', path: '/documents', config: DocumentController.getForProperty},
];

module.exports = DOCUMENT_ROUTES;
