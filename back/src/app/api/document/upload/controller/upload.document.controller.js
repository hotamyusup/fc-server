'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const Boom = require('boom');
const easyimg = require('easyimage');
const uuid = require('node-uuid');
const path = require('path');

const logger = require('../../../../core/logger');

const UploadDocumentDAO = require('../dao/upload.document.dao');

const fileDirPath = path.normalize(__dirname + '/../public/file');

class UploadDocumentController {
    constructor() {
        this.controllerName = 'UploadDocumentController';
    }

    get get() {
        return {
            handler: {
                directory: {path: fileDirPath}
            }
        }
    }

    get delete() {
        return {
            handler: async (request, reply) => {
                try {
                    const filePath = request.params.param;
                    UploadDocumentDAO.deleteFile(filePath);
                    reply({success: true, filePath})
                } catch (err) {
                    reply(Boom.forbidden(err))
                }
            }
        }
    }

    get filesForProperty() {
        return {
            handler: async (request, reply) => {
                const action = 'saveForProperty';
                const {PropertyID} = request.params;
                logger.info(`${this.controllerName}.${action} start, PropertyID === ${PropertyID}`);
                const fileList = await UploadDocumentDAO.getFileListForProperty(PropertyID);
                reply(fileList);
            }
        }
    }

    get saveForProperty() {
        return {
            handler: async (request, reply) => {
                const action = 'saveForProperty';
                const {PropertyID} = request.params;
                logger.info(`${this.controllerName}.${action} start, PropertyID === ${PropertyID}`);
                const file = request.payload.file;
                const filename = file.hapi.filename; //uuid.v4();

                const propertyDirPath = path.normalize(`${fileDirPath}/${PropertyID}/`);

                !fs.existsSync(propertyDirPath) && fs.mkdirSync(propertyDirPath);

                const uniqueFilename = (function getUniqueFilename(filename, number = 1) {
                    if (!fs.existsSync(propertyDirPath + filename)) {
                        return filename;
                    } else {
                        const filenameParts = `${filename}`.split('.');
                        const fileExtension = filenameParts.pop();
                        const uniqueFilename = [...filenameParts, number, fileExtension].join('.');
                        if (!fs.existsSync(propertyDirPath + uniqueFilename)) {
                            return uniqueFilename;
                        } else {
                            return getUniqueFilename(filename, ++number)
                        }
                    }
                })(filename);

                const filePath = propertyDirPath + uniqueFilename;
                file.pipe(fs.createWriteStream(filePath));
                file.on('end', () => reply(filename));
                file.on('error', err => reply(Boom.forbidden(err)));

                // fs.writeFile(filePath, file, (err) => {
                //     if (err) {
                //         logger.error(`${this.controllerName}.${action} write image file error: ${err}`);
                //     }
                // });

                logger.info(`${this.controllerName}.${action} finish`);

            },
            payload: {
                output: 'stream',
                maxBytes: 100000000,
                timeout: 11000000,
            },
            timeout: {
                socket: 12000000,
            },
        };
    }
}


module.exports = new UploadDocumentController();

