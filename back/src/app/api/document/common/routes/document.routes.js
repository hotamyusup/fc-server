'use strict';

const DocumentController = require("../controller/document.controller");

const DOCUMENT_ROUTES = [
    {method: 'GET', path: '/greystar/disclosure409/{DocumentID}.{format}', config: DocumentController.getFormattedGreystar},
    {method: 'POST', path: '/documents/{DocumentID}', config: DocumentController.update},
    {method: 'POST', path: '/documents/batch', config: DocumentController.batch},
    {method: 'GET', path: '/documents/hand-delivery/{OrganizationID}', config: DocumentController.getHandDeliveryForOrganization},
    {method: 'GET', path: '/documents/hand-delivery', config: DocumentController.getHandDeliveryForOrganization},
    {method: 'POST', path: '/documents/rebuild', config: DocumentController.rebuild},
    {method: 'POST', path: '/documents/notify-batch', config: DocumentController.notifyOnEmailBatch},
    {method: 'POST', path: '/documents/hand-delivery-batch', config: DocumentController.handDeliveryBatch},
    {method: 'POST', path: '/documents/{DocumentID}/sign', config: DocumentController.sign},
    {method: 'POST', path: '/documents/documentsZip', config: DocumentController.documentsZip},
    {method: 'POST', path: '/documents/documentsCSV', config: DocumentController.documentsCSV},
    {method: 'POST', path: '/documents/propertyDocumentsZip', config: DocumentController.propertyDocumentsZip},
    {method: 'POST', path: '/documents/propertyDocumentsCSV', config: DocumentController.propertyDocumentsCSV},
    {method: 'GET', path: '/documents/{DocumentID}/activate', config: DocumentController.activate},
    {method: 'GET', path: '/documents/{DocumentID}/deactivate', config: DocumentController.deactivate},
    {method: 'GET', path: '/documents/{DocumentID}/notify', config: DocumentController.notifyOnEmail},
    {method: 'GET', path: '/documents/{DocumentID}/history', config: DocumentController.history},
    {method: 'GET', path: '/documents/{DocumentID}.{format}', config: DocumentController.getFormatted},
    {method: 'GET', path: '/documents/{DocumentID}', config: DocumentController.get},
    {method: 'DELETE', path: '/documents/{DocumentID}.{format}', config: DocumentController.delete},
    {method: 'GET', path: '/documents', config: DocumentController.getForProperty},
];

module.exports = DOCUMENT_ROUTES;
