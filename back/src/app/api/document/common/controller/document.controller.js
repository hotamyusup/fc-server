'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const Boom = require('boom');
const moment = require('moment');
const FileReader = require('filereader');

const logger = require('../../../../core/logger');
const MailService = require('../../../../core/mail.service');

const BaseController = require("../../../../../app/core/base.controller");
const PropertyDAO = require("../../../property/property/dao/property.dao");

const UploadDocumentDAO = require('../../upload/dao/upload.document.dao');
const documentToMailMessage = require('../../fire-safety/mail/documentToMailMessage');

const PDFMakeService = require('../service/pdfmake.service');
const DocumentDAO = require("../dao/document.dao.instance");

class DocumentController extends BaseController {
    constructor() {
        super(DocumentDAO);
        this.controllerName = 'DocumentController';
        this.redirectUrl = '/documents/';
        this.requestIDKey = 'DocumentID';
    }


    get getForProperty() {
        return {
            handler: (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'getForProperty';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {PropertyID} = request.query;
                return this.handle(
                    action,
                    request,
                    reply,
                    (async () => {

                        const docModels = await this.DAO.forProperty(PropertyID);
                        const docs = _.map(docModels, doc => {
                            doc = doc.toJSON();
                            delete doc['definition'];
                            return doc;
                        });

                        const uploadDocs = await UploadDocumentDAO.getFileListForProperty(PropertyID);

                        const allDocs = [
                            ...docs,
                            ...uploadDocs
                        ];

                        return allDocs
                    })());
            }
        }
    }

    get getFormatted() {
        return {
            handler: (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'getDocument';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {format} = request.params;
                let handler;

                return this.handle(action, request, reply, this.DAO.get(request.params[this.requestIDKey]).then(document => {
                    if (format && format.toLowerCase() === 'pdf') {
                        return PDFMakeService.createPDFDocument(document.definition);
                    } else {
                        return document;
                    }
                }));
            }
        }
    }

    get activate() {
        return {
            handler: (request, reply) => {
                const action = 'activate';
                return this.handle(action, request, reply, this.DAO.get(request.params[this.requestIDKey]).then(document => {
                    document.Status = 1;
                    return document.save();
                }));
            }
        }
    }

    get deactivate() {
        return {
            handler: (request, reply) => {
                const action = 'deactivate';
                return this.handle(action, request, reply, this.DAO.get(request.params[this.requestIDKey]).then(document => {
                    document.Status = 0;
                    return document.save();
                }));
            }
        }
    }

    get notifyOnEmail() {
        return {
            handler: (request, reply) => {
                const action = 'notifyOnEmail';
                return this.handle(action, request, reply, this.DAO.get(request.params[this.requestIDKey]).then(notifyOnEmail));
            }
        }
    }

    get sign() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'sign';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                const signature = request.payload.signature;
                const signatureBase64 = 'data:image/png;base64,' + Buffer.from(signature).toString('base64');
                const document = await this.DAO.get(request.params[this.requestIDKey]);

                const definition = document.definition;
                const signerName = document.signer && document.signer.name;

                definition.content.forEach(row => {
                    if (row.template === 'signature') {
                        row.columns = [
                            [
                                {
                                    text: `Date: ${moment().format("DD MMMM YYYY")}`,
                                    alignment: "center",
                                    margin: [0, 50, 0, 0]
                                }
                            ],
                            [
                                {
                                    image: signatureBase64,
                                    style: "signature",
                                    height: 50,
                                    width: 50,
                                    alignment: "center"
                                },
                                {
                                    text: "_____________________________",
                                    style: "signature",
                                },
                                {
                                    text: `${signerName ? signerName : "resident signature"}`,
                                    style: "signature"
                                }
                            ],
                        ];
                        row.margin = [0, 40, 0, 0];
                    }
                });

                document.signed_at = new Date();
                document.updated_at = new Date();

                document.markModified('definition');

                return this.handle(action, request, reply, document.save().then((document) => {
                    notifyOnEmail(document);
                    return {_id: document._id};
                }));
            }
        }
    }
}

module.exports = new DocumentController();

function getBase64FromBlob(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onerror = (e) => {
            console.log(e);
            reject(e);
        };
        reader.onload = () => console.log('load === ');
        reader.onloadend = () => resolve(reader.result)
    });
}

async function notifyOnEmail(document) {
    if (document.type === 'fire-safety-disclosure') {
        const message = await documentToMailMessage(document);
        await MailService.sendMessage(message);
    } else {
        const pdfDoc = await PDFMakeService.createPDFDocument(document.definition);
        const title = `${document.title} - ${document.signer.name}`;
        const attachments = [{
            filename: `${title}.pdf`,
            content: pdfDoc
        }];

        await MailService.send(
            [document.signer.email],
            title,
            '',
            attachments
        );
    }

    document.notified_at = new Date();
    return document.save().then(d => ({_id: d._id}));
}
