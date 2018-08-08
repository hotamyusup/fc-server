'use strict';

const DocumentController = require("../controller/document.controller");

const DOCUMENT_ROUTES = [
    {method: 'GET', path: '/documents/{DocumentID}.{format}', config: DocumentController.getFormatted},
    {method: 'GET', path: '/documents/{DocumentID}', config: DocumentController.getFormatted},
    {method: 'POST', path: '/documents/{DocumentID}/sign', config: DocumentController.sign},
];

module.exports = DOCUMENT_ROUTES;
