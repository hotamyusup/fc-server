'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const _ = require('lodash');
const Boom = require('boom');
const moment = require('moment-timezone');
const archiver = require('archiver');
const FileReader = require('filereader');
const path = require('path');
const fs = require('fs');
const rimraf = require("rimraf");
const mkdirp = require('mkdirp');
const uuid = require('node-uuid');
const {parseAsync} = require('json2csv');

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

const BuildingDAO = require("../../../../api/property/building/dao/building.dao");
const FloorDAO = require("../../../../api/property/floor/dao/floor.dao");

const FILES_DIR_PATH = path.normalize(__dirname + '/../files');
const TMP_FILE_DIR_PATH = `${FILES_DIR_PATH}/tmp`;

class DocumentController extends BaseController {
    constructor() {
        super(DocumentDAO);
        this.controllerName = 'DocumentController';
        this.redirectUrl = '/documents/';
        this.requestIDKey = 'DocumentID';
        this.batchEntitiesKey = 'documents';
    }


    get getOrganizationDocumentsStatus() {
        return {
            handler: (request, reply) => {
                const hash = request.query.hash || '';
                const user = request.auth && request.auth.credentials;
                const OrganizationID = user.Organization;
                const action = 'getOrganizationDocumentsStatus';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start OrganizationID = ${OrganizationID}`);

                const status = {
                    waitingForDelivered: 0,
                    handDelivered: 0,
                    scheduled: 0,
                    notified: 0,
                    bounced: 0,
                };

                return this.handle(
                    action,
                    request,
                    reply,
                    this.DAO.forOrganization(OrganizationID, {
                        "signer.email" : { $in : [null, '']}
                    })
                );
            }
        }
    }

    get getHandDeliveryForOrganization() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const user = request.auth && request.auth.credentials;
                let OrganizationID = user.Organization;
                const action = 'getHandDeliveryForOrganization';
                if (user.Type === 'Admin') {
                    if (request.query.OrganizationID) {
                        OrganizationID = request.query.OrganizationID;
                    }
                }

                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start OrganizationID = ${OrganizationID}`);

                const {from, sort, limit, skip} = request.query;

                const options = {
                    sort: sort ? JSON.parse(decodeURIComponent(sort)) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    skip: skip ? parseInt(skip) : undefined
                };

                const conditions = {
                    "signer.email" : { $in : [null, '']}
                };
                if (from) {
                    conditions.updated_at = {
                        $gt: moment(from).toDate()
                    }
                }

                if (user.Type === 'Customer') {
                    const properties = await PropertyDAO.getPropertiesForPropertyManager(user._id);
                    const managedProperties = [...properties.map(property => property._id)];
                    if (managedProperties.length) {
                        conditions.PropertyID = {$in: managedProperties};
                    }
                }

                const prepare = find => find
                    .populate('PropertyID', {Title: 1})
                    .populate('BuildingID', {Title: 1, PropertyID: 1})
                    .populate('FloorID', {Title: 1, PropertyID: 1, BuildingID: 1});

                return this.handle(
                    action,
                    request,
                    reply,
                    this.DAO
                        .forOrganization(OrganizationID, conditions, options, undefined, prepare)
                        .then(documents => documents.map(document => ({
                            ...document.toJSON(),
                            Property: document.PropertyID,
                            PropertyID: document.PropertyID._id,
                            Building: document.BuildingID,
                            BuildingID: document.BuildingID._id,
                            Floor: document.FloorID,
                            FloorID: document.FloorID._id,
                        })))
                );
            }
        }
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

    get getFormattedGreystar() {
        return {
            auth: false,
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'getFormattedGreystar';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                this.getFormatted.handler(request, reply)
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
                const {noDefinition} = request.query;

                return this.handle(action, request, reply, this.DAO.get(request.params[this.requestIDKey]).then(document => {
                    if (format && format.toLowerCase() === 'pdf') {
                        return PDFMakeService.createPDFDocument(document.definition);
                    } else {
                        const jsonDocument = document.toJSON();

                        if (noDefinition) {
                            delete jsonDocument['definition'];
                        }

                        return jsonDocument;
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

    get documentsCSV() {
        return {
            payload: {
                maxBytes: 100 * 1024 * 1024,
                timeout: 1000 * 60 * 60,
            },
            timeout: {
                socket: 1000 * 60 * 61,
                server: 1000 * 60 * 60
            },
            handler: async (request, reply) => {
                const {hash} = request.query;
                const {documentIds} = request.payload;
                const action = 'documentsCSV';

                try {
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                    const findDocumentsByIdQuery = {_id: {$in: _.map(documentIds, mongoose.Types.ObjectId)}};
                    const documents = await this.DAO.all(findDocumentsByIdQuery, null, {definition: 0})
                        .populate('PropertyID', {Title: 1})
                        .populate('BuildingID', {Title: 1})
                        .populate('FloorID', {Title: 1});

                    const bouncedDocumentIdsSet = await getBouncedDocumentsByIds(documentIds);

                    const csv = await parseAsync(documents, {
                        fields: [
                            {
                                label: 'Resident email',
                                value: 'signer.email',
                            },
                            {
                                label: 'Resident name',
                                value: 'signer.name',
                            },
                            {
                                label: 'Property',
                                value: document => document.PropertyID && document.PropertyID.Title || '',
                            },
                            {
                                label: 'Building',
                                value: document => document.BuildingID && document.BuildingID.Title || '',
                            },
                            {
                                label: 'Floor',
                                value: document => document.FloorID && document.FloorID.Title || '',
                            },
                            {
                                label: 'Last time notified_at',
                                value: document => {
                                    if (document.notified_at) {
                                        const dateTimeInLA = moment(document.notified_at).tz("America/Los_Angeles");
                                        return dateTimeInLA.format('LLL')
                                    }
                                },
                            },
                            {
                                label: 'Language',
                                value: 'options.language',
                            },
                            {
                                label: 'Status',
                                value: document => {
                                    if (bouncedDocumentIdsSet[document._id]) {
                                        return 'Bounced'
                                    } else if (document.Status === 1) {
                                        return 'Scheduled'
                                    } else if (document.Status === 0) {
                                        return 'Deactivated'
                                    } else if (document.Status === -1) {
                                        return 'Deleted'
                                    }
                                },
                            }
                        ]
                    });

                    const filename = `Exported documents - ${moment().format('YYYY-MM-DD')}`.replace(/[^a-z0-9 -]/gi, '_').trim() + '.csv';

                    return reply(csv)
                        .header('Content-Type', 'application/octet-stream')
                        .header('content-disposition', `attachment; filename=${filename}`);

                } catch (e) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error === ${e}`);
                    logger.error(e);
                    reply(Boom.badImplementation(e));
                }
            }
        }
    }

    get documentsZip() {
        return {
            payload: {
                maxBytes: 100 * 1024 * 1024,
                timeout: 1000 * 60 * 60,
            },
            timeout: {
                socket: 1000 * 60 * 61,
                server: 1000 * 60 * 60
            },
            handler: async (request, reply) => {
                const {hash} = request.query;
                const {documentIds} = request.payload;
                const action = 'documentsZip';

                try {
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                    const sessionDirName = `${action}-session-${uuid.v4()}`;
                    const sessionDirPath = `${TMP_FILE_DIR_PATH}/${sessionDirName}`;

                    await createDir(sessionDirPath);

                    const exportFilesDirName = `Documents Export - ${moment().format('YYYY-MM-DD')}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                    const exportFilesDirPath = `${sessionDirPath}/${exportFilesDirName}`;

                    await createDir(exportFilesDirPath);

                    const id2propertyDirName = {};

                    for (const documentId of documentIds) {
                        const document = await DocumentDAO.get(documentId)
                            .populate('PropertyID', {Title: 1})
                            .populate('BuildingID', {Title: 1})
                            .populate('FloorID', {Title: 1});

                        const property = document.PropertyID;
                        const building = document.BuildingID;
                        const floor = document.FloorID;

                        let propertyDirName = id2propertyDirName[property._id];
                        if (!propertyDirName) {
                            propertyDirName = `${property.Title}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                            id2propertyDirName[property._id] = propertyDirName
                            const propertyDirPath = `${exportFilesDirPath}/${propertyDirName}`;
                            await createDir(propertyDirPath);
                        }

                        const floorsDirPath = `${exportFilesDirPath}/${propertyDirName}`;

                        const {signer, definition} = document;
                        let unit = signer && signer.unit && `${signer.unit}`.trim();

                        const floorFileName = `${building.Title} - ${floor.Title}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                        const floorUnitsDirPath = `${floorsDirPath}/${floorFileName}`;
                        await createDir(floorUnitsDirPath);

                        const unitTitle = unit ? `- Unit ${unit}` : '';
                        const filename = `${building.Title} - ${floor.Title} ${unitTitle}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                        const filePath = `${floorUnitsDirPath}/${filename}.pdf`;

                        const pdfDocument = await PDFMakeService.createPDFDocument(definition, filePath);
                    }

                    const archive = archiver('zip');
                    const sessionDirZipPath = `${sessionDirPath}/${exportFilesDirName}.zip`;

                    const output = fs.createWriteStream(sessionDirZipPath); //path to create .zip file
                    output.on('close', () => {
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} archive complete: ${archive.pointer()} total bytes`);
                        reply
                            .file(sessionDirZipPath, {mode: 'attachment', filename: `${exportFilesDirName}.zip`})
                            .once('finish', () => {
                                rimraf(sessionDirPath, () => {
                                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} rm -rf ${sessionDirPath} done`);
                                });
                            });
                    });

                    archive.on('error', (err) => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} archive error: ${err.message}`);
                        logger.error(err);
                        reply(Boom.forbidden(err))
                    });

                    archive.pipe(output);
                    archive.directory(exportFilesDirPath, exportFilesDirName);
                    archive.finalize();

                } catch (e) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error === ${e}`);
                    logger.error(e);
                    reply(Boom.badImplementation(e));
                }
            }
        }
    }

    get propertyDocumentsCSV() {
        return {
            payload: {
                maxBytes: 100 * 1024 * 1024,
                timeout: 1000 * 60 * 60,
            },
            timeout: {
                socket: 1000 * 60 * 61,
                server: 1000 * 60 * 60
            },
            handler: async (request, reply) => {
                const {hash, PropertyID} = request.query;
                const {documentIds} = request.payload;
                const action = 'documentsCSV';

                try {
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                    const property = await PropertyDAO.get(PropertyID);

                    const findDocumentsByIdQuery = {_id: {$in: _.map(documentIds, mongoose.Types.ObjectId)}};
                    const documents = await this.DAO.all(findDocumentsByIdQuery, null, {definition: 0});
                    const bouncedDocumentIdsSet = await getBouncedDocumentsByIds(documentIds);

                    const floorIds = {};
                    _.forEach(documents, ({FloorID}) => floorIds[FloorID] = FloorID);
                    const floors = await FloorDAO.all({_id: {$in: _.map(_.keys(floorIds), mongoose.Types.ObjectId)}});
                    const id2floor = _.keyBy(floors, '_id');

                    const buildingIds = {};
                    _.forEach(floors, ({BuildingID}) => buildingIds[BuildingID] = BuildingID);
                    const buildings = await BuildingDAO.all({_id: {$in: _.map(_.keys(buildingIds), mongoose.Types.ObjectId)}});
                    const id2building = _.keyBy(buildings, '_id');

                    const csv = await parseAsync(documents, {
                        fields: [
                            {
                                label: 'Resident email',
                                value: 'signer.email',
                            },
                            {
                                label: 'Resident name',
                                value: 'signer.name',
                            },
                            {
                                label: 'Building',
                                value: document => {
                                    const floor = id2floor[document.FloorID];
                                    const building = floor && id2building[floor.BuildingID];
                                    return building && building.Title || '';
                                },
                            },
                            {
                                label: 'Floor',
                                value: document => id2floor[document.FloorID] && id2floor[document.FloorID].Title || '',
                            },
                            {
                                label: 'Last time notified_at',
                                value: document => {
                                    if (document.notified_at) {
                                        const dateTimeInLA = moment(document.notified_at).tz("America/Los_Angeles");
                                        return dateTimeInLA.format('LLL')
                                    }
                                },
                            },
                            {
                                label: 'Language',
                                value: 'options.language',
                            },
                            {
                                label: 'Status',
                                value: document => {
                                    if (bouncedDocumentIdsSet[document._id]) {
                                        return 'Bounced'
                                    } else if (document.Status === 1) {
                                        return 'Scheduled'
                                    } else if (document.Status === 0) {
                                        return 'Deactivated'
                                    } else if (document.Status === -1) {
                                        return 'Deleted'
                                    }
                                },
                            }
                        ]
                    });

                    const filename = `${property.Title} - ${moment().format('YYYY-MM-DD')}`.replace(/[^a-z0-9 -]/gi, '_').trim() + '.csv';

                    return reply(csv)
                        .header('Content-Type', 'application/octet-stream')
                        .header('content-disposition', `attachment; filename=${filename}`);

                } catch (e) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error === ${e}`);
                    logger.error(e);
                    reply(Boom.badImplementation(e));
                }
            }
        }
    }

    get propertyDocumentsZip() {
        return {
            payload: {
                maxBytes: 100 * 1024 * 1024,
                timeout: 1000 * 60 * 60,
            },
            timeout: {
                socket: 1000 * 60 * 61,
                server: 1000 * 60 * 60
            },
            handler: async (request, reply) => {
                const {hash, PropertyID} = request.query;
                const {documentIds} = request.payload;
                const action = 'documentsZip';

                try {
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                    const sessionDirName = `${action}-session-${uuid.v4()}`;
                    const sessionDirPath = `${TMP_FILE_DIR_PATH}/${sessionDirName}`;

                    await createDir(sessionDirPath);

                    const property = await PropertyDAO.get(PropertyID);
                    const buildings = await BuildingDAO.forProperty(PropertyID);
                    const floors = await FloorDAO.forProperty(PropertyID);

                    const id2building = _.keyBy(buildings, '_id');
                    const id2floor = _.keyBy(floors, '_id');

                    const propertyDirName = `${property.Title} - ${moment().format('YYYY-MM-DD')}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                    const propertyDirPath = `${sessionDirPath}/${propertyDirName}`;
                    const floorsDirPath = `${propertyDirPath}`; //floors`;
                    await createDir(floorsDirPath);

                    for (const documentId of documentIds) {
                        const document = await DocumentDAO.get(documentId);
                        const {FloorID, signer, definition} = document;
                        const floor = id2floor[FloorID];
                        const building = id2building[floor.BuildingID];

                        let unit = signer && signer.unit && `${signer.unit}`.trim();

                        const floorFileName = `${building.Title} - ${floor.Title}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                        const floorUnitsDirPath = `${floorsDirPath}/${floorFileName}`;
                        await createDir(floorUnitsDirPath);

                        const unitTitle = unit ? `- Unit ${unit}` : '';
                        const filename = `${building.Title} - ${floor.Title} ${unitTitle}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                        const filePath = `${floorUnitsDirPath}/${filename}.pdf`;

                        await PDFMakeService.createPDFDocument(definition, filePath);
                    }

                    const archive = archiver('zip');
                    const sessionDirZipPath = `${sessionDirPath}/${propertyDirName}.zip`;

                    const output = fs.createWriteStream(sessionDirZipPath); //path to create .zip file
                    output.on('close', () => {
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} archive complete: ${archive.pointer()} total bytes`);
                        reply
                            .file(sessionDirZipPath, {mode: 'attachment', filename: `${propertyDirName}.zip`})
                            .once('finish', () => {
                                rimraf(sessionDirPath, () => {
                                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} rm -rf ${sessionDirPath} done`);
                                });
                            });
                    });

                    archive.on('error', (err) => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} archive error: ${err.message}`);
                        logger.error(err);
                        reply(Boom.forbidden(err))
                    });

                    archive.pipe(output);
                    archive.directory(propertyDirPath, propertyDirName);
                    archive.finalize();

                } catch (e) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error === ${e}`);
                    logger.error(e);
                    reply(Boom.badImplementation(e));
                }
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
    return getBouncedDocumentsIds({PropertyID: mongoose.Types.ObjectId(PropertyID)});
}

async function getBouncedDocumentsByIds(documentIds) {
    return getBouncedDocumentsIds({_id: {$in: _.map(documentIds, mongoose.Types.ObjectId)}});
}

async function getBouncedDocumentsIds(match) {
    const bouncedDocumentsIds = await DocumentDAO.aggregate([
        {
            $match: {
                ...match,
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

async function createDir(path) {
    return new Promise((resolve, reject) => {
        mkdirp(path, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });

    })
}