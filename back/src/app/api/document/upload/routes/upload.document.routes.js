'use strict';

const UploadDocumentController = require("../controller/upload.document.controller");

const UPLOAD_DOCUMENT_ROUTES = [
    {method: 'GET', path: '/documents/upload/file/{PropertyID}', config: UploadDocumentController.filesForProperty},
    // {method: 'GET', path: '/documents/upload/file/{PropertyID}/{param*}', config: UploadDocumentController.get},
    {method: 'POST', path: '/documents/upload/file/{PropertyID}', config: UploadDocumentController.saveForProperty},
    {method: 'GET', path: '/documents/upload/file/{param*}', config: UploadDocumentController.get},
    {method: 'DELETE', path: '/documents/upload/file/{param*}', config: UploadDocumentController.delete},
];

module.exports = UPLOAD_DOCUMENT_ROUTES;
