'use strict';

const Promise = require('bluebird');
const path = require('path');
const _ = require('lodash');
const Boom = require('boom');
const FileReader = require('filereader');

const logger = require('../../../../core/logger');
const MailService = require('../../../../core/mail.service');

const PDFMakeService = require('../service/pdfmake.service');


const PropertyDAO = require("../../../property/property/dao/property.dao");
const BaseController = require("../../../../../app/core/base.controller");
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
                    this.DAO.all({PropertyID})
                        .then(docs => _.map(docs, doc => {
                                doc = doc.toJSON();
                                delete doc['definition'];
                                return doc;
                            })
                        ));
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
            handler: async(request, reply) => {
                const hash = request.query.hash || '';
                const action = 'sign';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                const signature = request.payload.signature;
                const signatureBase64 = 'data:image/png;base64,' + Buffer.from(signature).toString('base64');
                const document = await this.DAO.get(request.params[this.requestIDKey]);

                const definition = document.definition;

                definition.content.forEach(row => {
                    if (row.template === 'signature') {
                        const signatureImageElem = {
                            image: signatureBase64,
                            style: "signature",
                            height: 50,
                            width: 50,
                            alignment: "center"
                        };

                        if (row.columns[1].length === 2) {
                            row.columns[1].unshift(signatureImageElem);
                        } else {
                            row.columns[1][0] = signatureImageElem;
                        }

                        row.columns[0][0].margin = [0, 50, 0, 0];
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
    const pdfDoc = await PDFMakeService.createPDFDocument(document.definition);

    const title = `${document.title} - ${document.signer.name}`;

    const attachments = [{
        filename: `${title}.pdf`,
        content: pdfDoc
    }];

    if (document.type === 'fire-safety-disclosure') {
        const language = document.options && document.options.language || 'ENGLISH';
        const language2fireSafetyDocumentTitle = {
            ENGLISH: 'Fire Safety Tips for SF (Apr 2017).pdf',
            CHINESE: 'SFFD Fire Safety Tips (rev. Aug 2017) - CHINESE.pdf',
            FILIPINO: 'SFFD Fire Safety Tips (rev. Aug 2017) - FILIPINO.pdf',
            RUSSIAN: 'SFFD Fire Safety Tips (rev. Aug 2017) - RUSSIAN.pdf',
            SPANISH: 'SFFD Fire Safety Tips (rev. Aug 2017) - SPANISH.pdf',
            VIETNAMESE: 'SFFD Fire Safety Tips (rev. Aug 2017) - VIETNAMESE.pdf',
        };
        const filename = language2fireSafetyDocumentTitle[language];
        attachments.push({
            filename,
            path: path.normalize(`${__dirname}../../../fire-safety/files/${filename}`),
        });

        const filesToAttach = [
            'fire alarm sleeping area requirements.pdf',
            'tenant fire safety disclosure.pdf',
            'smoke alarm info disclosure.pdf',
        ].map(filename => ({filename, path: path.normalize(`${__dirname}../../../fire-safety/files/${filename}`)}));

        attachments.push(...filesToAttach);
    }

    const property = await PropertyDAO.get(document.PropertyID);

    let propertyManagerEmail = property.Contacts[0].Email;
    const isDebug = true;
    if (isDebug) {
        propertyManagerEmail = 'zo0mcfg@gmail.com';
    }

    await MailService.send(
        [document.signer.email, propertyManagerEmail],
        title,
        '',
        attachments
    );

    document.notified_at = new Date();
    return document.save().then(d => ({_id: d._id}));
}