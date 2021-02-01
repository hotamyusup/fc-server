'use strict';
const _ = require('underscore');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const rimraf = require("rimraf");
const mkdirp = require('mkdirp');
const uuid = require('node-uuid');
const Boom = require('boom');
const logger = require('../../../../core/logger');
const Promise = require('bluebird');
const archiver = require('archiver');

const FireSafetyDAO = require("../dao/fire-safety.document.dao");
const PropertyDAO = require("../../../../api/property/property/dao/property.dao");
const BuildingDAO = require("../../../../api/property/building/dao/building.dao");
const FloorDAO = require("../../../../api/property/floor/dao/floor.dao");
const DeviceDAO = require("../../../../api/property/device/dao/device.dao");
const BaseController = require("../../../../core/base.controller");

const TenantFireSafetyDisclosureDocumentBuilder = require("../template/tenant-fire-safety-disclosure-information.document-builder");
const PDFMakeService = require("../../common/service/pdfmake.service");

const FILES_DIR_PATH = path.normalize(__dirname + '/../files');
const TMP_FILE_DIR_PATH = `${FILES_DIR_PATH}/tmp`;

class FireSafetyDocumentController extends BaseController {
    constructor() {
        super(FireSafetyDAO);
        this.controllerName = 'FireSafetyDocumentController';
        this.requestIDKey = 'DocumentID';
    }

    get getDocument() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'getDocument';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {FloorID} = request.query;

                if (!FloorID) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} FloorID must be defined`);
                    return reply(Boom.badImplementation("FloorID must be defined"));
                }

                const docDefinition = await TenantFireSafetyDisclosureDocumentBuilder.build(FloorID);

                return this.handle(action, request, reply, PDFMakeService.createPDFDocument(docDefinition));
            }
        };
    }

    async createDocument(FloorID, signer, language) {
        const docDefinition = await TenantFireSafetyDisclosureDocumentBuilder.build(FloorID, signer);
        const floor = await FloorDAO.get(FloorID);
        const newDocument = {
            type: 'fire-safety-disclosure',
            Status: 1,
            title: 'RESIDENT FIRE SAFETY DISCLOSURE INFORMATION',
            options: {language},
            definition: docDefinition,
            signer: signer,
            created_at: new Date(),
            updated_at: new Date(),
            PropertyID: floor.PropertyID,
            BuildingID: floor.BuildingID,
            FloorID: floor._id,
        };

        return this.DAO.create(newDocument)
    }

    get generateDocument() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'generateDocument';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {FloorID, tenant, language} = request.payload;

                if (!FloorID) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} FloorID must be defined`);
                    return reply(Boom.badImplementation("FloorID must be defined"));
                }

                this.createDocument(FloorID, tenant, language)
                    .then((model) => {
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                        model = model.toJSON();
                        delete model['definition'];
                        return reply(model);
                    })
                    .catch(err => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);

                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden('please provide another id, it already exist'));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });

            }
        };
    }

    get generateDocuments() {
        return {
            handler: async (request, reply) => {
                const hash = request.query.hash || '';
                const action = 'generateDocuments';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {documents} = request.payload;

                if (!documents || !documents.length) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} {documents[]} must be defined`);
                    return reply(Boom.badImplementation("{documents[]} must be defined"));
                }

                if (_.filter(documents, document => !document.FloorID).length) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} FloorID must be defined in all documents`);
                    return reply(Boom.badImplementation("FloorID must be defined in all documents"));
                }

                Promise
                    .map(documents, async ({FloorID, signer, language}) => {
                        const model = await this.createDocument(FloorID, signer, language);
                        const modelJSON = model.toJSON();
                        delete modelJSON['definition'];
                        return modelJSON;
                    }, {concurrency: 10})
                    .then((models) => {
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                        return reply(models);
                    })
                    .catch(err => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);

                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden('please provide another id, it already exist'));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });

            }
        };
    }

    get templatesZip() {
        return {
            timeout: {
                socket: 1000 * 60 * 61,
                server: 1000 * 60 * 60
            },
            handler: async (request, reply) => {
                try {
                    const {hash, PropertyID} = request.query;
                    const action = 'templatesZip';
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.payload)} ${JSON.stringify(request.params)}`);

                    const property = await PropertyDAO.get(PropertyID);
                    const buildings = await BuildingDAO.forProperty(PropertyID);
                    const id2building = _.indexBy(buildings, '_id');
                    const floors = await FloorDAO.forProperty(PropertyID);
                    const filteredFloors = floors.filter(floor =>
                        floor.Status === 1
                        && id2building[floor.BuildingID]
                        && id2building[floor.BuildingID].Status === 1
                    );

                    const sessionDirName = `templatesZip-session-${uuid.v4()}`;
                    const sessionDirPath = `${TMP_FILE_DIR_PATH}/${sessionDirName}`;

                    await createDir(sessionDirPath);

                    const propertyDirName = `${property.Title} - ${moment().format('YYYY-MM-DD')}`.replace(/[^a-z0-9 -]/gi, '_').trim();
                    const propertyDirPath = `${sessionDirPath}/${propertyDirName}`;
                    const floorsDirPath = `${propertyDirPath}/floors`;
                    await createDir(floorsDirPath);

                    const smokedetectorDeviceTypes = TenantFireSafetyDisclosureDocumentBuilder.getDeviceTypes('smokedetector')
                    const getUnitNumberRegex = /^(unit[ \-\.]*([\w\d]*))/i;

                    await Promise.map(filteredFloors, async floor => {
                        const building = id2building[floor.BuildingID];

                        //removed by FC management request
                        //const docDefinition = await TenantFireSafetyDisclosureDocumentBuilder.build(floor._id);

                        const floorFileName = `${building.Title} - ${floor.Title}`.replace(/[^a-z0-9 -]/gi, '_').trim();

                        //const filePath = `${floorsDirPath}/${floorFileName}.pdf`;

                        //const pdfDocument = await PDFMakeService.createPDFDocument(docDefinition, filePath);

                        const devices = await DeviceDAO.all({
                                FloorID: floor._id,
                                DeviceType: {$in: smokedetectorDeviceTypes}, // all smokedetector DeviceTypes OR filter by DeviceType "5d4b600162dd8f13bdfaa3f6" IN UNIT/SMOKE ALARM
                                DeviceLocation: /^(unit[ \-\.]*([\w\d]*))/i
                            }
                        );

                        const floorUnits = _.keys(_.reduce(devices, (unitsSet, device) => {
                            const result = getUnitNumberRegex.exec(device.DeviceLocation);
                            const unitNumber = result && result[2];
                            if (unitNumber) {
                                unitsSet[unitNumber] = unitNumber;
                            }

                            return unitsSet;
                        }, {}));

                        if (floorUnits.length) {
                            const floorUnitsDirPath = `${floorsDirPath}/${floorFileName} Units`;
                            await createDir(floorUnitsDirPath);

                            await Promise.mapSeries(floorUnits, async unit => {

                                const unitDocDefinition = await TenantFireSafetyDisclosureDocumentBuilder.build(floor._id, {unit});

                                const filename = `${building.Title} - ${floor.Title} - Unit ${unit}`.replace(/[^a-z0-9 -]/gi, '_').trim();

                                const filePath = `${floorUnitsDirPath}/${filename}.pdf`;

                                const pdfDocument = await PDFMakeService.createPDFDocument(unitDocDefinition, filePath);
                            })
                        }

                    }, {concurrency : 2});


                    const commonDirPath = `${propertyDirPath}/common`;
                    await createDir(commonDirPath);

                    const commonFiles = [
                        'fire alarm sleeping area requirements.pdf',
                        'resident fire safety disclosure.pdf',
                        'smoke alarm info disclosure.pdf',
                        'CO alarm info disclosure.pdf',
                        'Smoke_CO_Disclosure_Fire_Department.pdf',
                        'SFFD Fire Safety Tips (rev. Aug 2017) - CHINESE.pdf',
                        'SFFD Fire Safety Tips (rev. Aug 2017) - FILIPINO.pdf',
                        'SFFD Fire Safety Tips (rev. Aug 2017) - RUSSIAN.pdf',
                        'SFFD Fire Safety Tips (rev. Aug 2017) - SPANISH.pdf',
                        'SFFD Fire Safety Tips (rev. Aug 2017) - VIETNAMESE.pdf',
                    ];

                    await Promise.map(commonFiles, filename => {
                        const sourceFilePath = `${FILES_DIR_PATH}/${filename}`;
                        const destinationFilePath = `${commonDirPath}/${filename}`;
                        return copyFile(sourceFilePath, destinationFilePath);
                    });

                    const archive = archiver('zip');
                    const sessionDirZipPath = `${sessionDirPath}/${propertyDirName}.zip`;

                    const output = fs.createWriteStream(sessionDirZipPath); //path to create .zip file
                    output.on('close', () => {
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} archive complete: ${archive.pointer()} total bytes`);
                        // console.log('archiver has been finalized and the output file descriptor has closed.');
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
                }
            }
        }
    }
}

module.exports = new FireSafetyDocumentController();

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

async function copyFile(sourceFilePath, destinationFilePath) {
    return new Promise((resolve, reject) => {
        fs.copyFile(sourceFilePath, destinationFilePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve()
            }
        });
    })
}
