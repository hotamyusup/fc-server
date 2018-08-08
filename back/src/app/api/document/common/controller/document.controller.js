'use strict';
const _ = require('lodash');
const Boom = require('boom');
const FileReader = require('filereader');

const logger = require('../../../../core/logger');
const PDFMakeService = require('../service/pdfmake.service');


const BaseController = require("../../../../../app/core/base.controller");
const DocumentDAO = require("../dao/document.dao.instance");

class DocumentController extends BaseController {
    constructor() {
        super(DocumentDAO);
        this.controllerName = 'DocumentController';
        this.redirectUrl = '/documents/';
        this.requestIDKey = 'DocumentID';
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

    get sign() {
        return {
            handler: async(request, reply) => {
                const hash = request.query.hash || '';
                const action = 'sign';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                const signature = request.payload.signature;
                console.log('signature === ', signature);
                // const signatureBase64 = await getBase64FromBlob(signature);
                const signatureBase64 = 'data:image/png;base64,' + Buffer.from(signature).toString('base64');
                console.log('signatureBase64 === ' + signatureBase64.substr(0, 200));
                const document = await this.DAO.get(request.params[this.requestIDKey]);

                const definition = document.definition;
                definition.content.forEach(row => {
                    if (row.template === 'signature') {
                        console.log(`row.template === 'signature'`);
                        const signatureImageElem = {
                            image: signatureBase64,
                            style: "signature",
                            height: 50,
                            width: 50,
                        };

                        if (row.columns[1].length === 2) {
                            row.columns[1].unshift(signatureImageElem);
                        } else {
                            row.columns[1][0] = signatureImageElem;
                        }

                        row.columns[0][0].margin  = [0, 50, 0, 0];
                    }
                });

                document.signed_at = new Date();
                document.updated_at = new Date();

                document.markModified('definition');

                return this.handle(action, request, reply, document.save());
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