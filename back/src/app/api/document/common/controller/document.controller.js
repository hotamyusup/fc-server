'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const _ = require('lodash');
const Boom = require('boom');
const moment = require('moment');
const FileReader = require('filereader');

const logger = require('../../../../core/logger');
const MailService = require('../../../../core/mail.service');

const BaseController = require("../../../../../app/core/base.controller");
const PropertyDAO = require("../../../property/property/dao/property.dao");

const SendGridService = require('../../common/service/sendgrid.service');
const TenantFireSafetyDisclosureDocumentBuilder = require("../../fire-safety/template/tenant-fire-safety-disclosure-information.document-builder");

const UploadDocumentDAO = require('../../upload/dao/upload.document.dao');
const documentToMailMessage = require('../../fire-safety/mail/documentToMailMessage');

const PDFMakeService = require('../service/pdfmake.service');
const DocumentDAO = require("../dao/document.dao.instance");
const BouncedMailDAO = require("../dao/bounced-mail.dao.instance");

class DocumentController extends BaseController {
    constructor() {
        super(DocumentDAO);
        this.controllerName = 'DocumentController';
        this.redirectUrl = '/documents/';
        this.requestIDKey = 'DocumentID';
        this.batchEntitiesKey = 'documents';
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
                        const bouncedDocumentIdsSet = await getBouncedDocumentsIdsForProperty(PropertyID);

                        const docModels = await this.DAO.forProperty(PropertyID);
                        const docs = _.map(docModels, doc => {
                            doc = doc.toJSON();
                            delete doc['definition'];

                            if (bouncedDocumentIdsSet[doc._id]) {
                                doc.bounced = true;
                            }

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

    get rebuild() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'rebuild';
                const documentIds = request.payload[this.batchEntitiesKey];

                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start, documentIds.length = ${documentIds && documentIds.length}`);

                return this.handle(action, request, reply, (async ()=> {
                    const documents = await this.DAO.all({_id: {$in: _.map(documentIds, mongoose.Types.ObjectId)}}, undefined, {_id : 1, FloorID: 1, signer: 1, options: 1});

                    const tenantsDataList = _.map(documents, ({_id, FloorID, signer, options}) => ({
                        _id,
                        FloorID,
                        signer,
                        language: options && options.language || undefined
                    }));

                    // // old version for comparison
                    // let index = 0;
                    // const updatedDocumentsIds = await Promise.map(tenantsDataList, async ({_id, FloorID, signer}) => {
                    //     console.log(`process ${++index}/${tenantsDataList.length} --> ${_id}`);
                    //     const definition = await TenantFireSafetyDisclosureDocumentBuilder.build(FloorID, signer);
                    //     await this.DAO.update({_id, definition});
                    //     return _id;
                    // }, {concurrency: 10});

                    const updatedDocumentsIds = await TenantFireSafetyDisclosureDocumentBuilder.buildBatch(tenantsDataList, async (definition, tenantData, cachedData) => {
                        const {_id} = tenantData;
                        await this.DAO.update({_id, definition});
                        return _id;
                    });

                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success, updated ${updatedDocumentsIds.length} documents`);

                    return updatedDocumentsIds;
                })());
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

    get notifyOnEmailBatch() {
        return {
            handler: (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'notifyOnEmailBatch';
                const entitiesJSON = request.payload[this.batchEntitiesKey];

                return this.handle(action, request, reply,
                    Promise
                        .map(entitiesJSON, entityJSON => this.DAO.get(entityJSON._id).then(notifyOnEmail), {concurrency: 10})
                        .catch(error => {
                            logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error: ${error}`);
                            throw error;
                        })
                );
            },
            payload: {
                maxBytes: 100 * 1024 * 1024,
                timeout: 3 * 60 * 60 * 1000,
            },
            timeout: {
                socket: 3 * 60 * 60 * 1000 + 1000,
            },
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

    SendGridService.fetchNewBouncesFromSendGridDebounced();

    document.notified_at = new Date();
    return document.save().then(d => ({_id: d._id}));
}

/**
 *
 * @param PropertyID
 * @returns {Promise<{_id: true}>}
 */
async function getBouncedDocumentsIdsForProperty(PropertyID) {
    const bouncedDocumentsIds = await DocumentDAO.aggregate([
        {
            $match: {
                PropertyID: mongoose.Types.ObjectId(PropertyID),
                'signer.email': {$exists: true}
            }
        },
        {
            $lookup: {
                from: "bouncedmails",
                localField: "signer.email",
                foreignField: "email",
                as: "Bounce"
            }
        },
        // {
        //     $unwind: {
        //         path: "$Bounce",
        //         preserveNullAndEmptyArrays: true
        //     }
        // },
        // {
        //     $match: {
        //         Bounce: {$exists: true}
        //     }
        // },
        {
            $match: {
                Bounce: {
                    $exists: true,
                    $not: {$size: 0}
                }
            }
        },
        {
            $project: {
                _id: '$_id'
            }
        },
    ]);

    const bouncedDocumentsIdsSet = {};
    for (const {_id} of bouncedDocumentsIds) {
        bouncedDocumentsIdsSet[_id] = true;
    }

    return bouncedDocumentsIdsSet;
}