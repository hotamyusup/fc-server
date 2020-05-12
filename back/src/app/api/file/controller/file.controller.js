'use strict';
const logger = require('../../../core/logger');
const fs = require('fs');
const easyimg = require('easyimage');
const uuid = require('node-uuid');
const path = require('path');

class FileController {
    constructor() {
        this.controllerName = 'FileController';
    }

    get get() {
        return {
            auth: false,
            handler: {
                directory: {path: path.normalize(__dirname + '/../public/file')},
            }
        }
    }

    get save() {
        const uploadsFilePath = path.normalize(__dirname + '/../public/file/');

        return {
            auth: false,
            handler: async (request, reply) => {
                let {fileName} = request.query;
                const action = 'saveFile';

                try {
                    logger.info(`${this.controllerName}.${action} start ${fileName ? fileName : ''}`);

                    const file = request.payload.file;
                    fileName = fileName || uuid.v4();
                    const newFilePath = uploadsFilePath + fileName;

                    fs.renameSync(file.path, newFilePath);

                    return reply(fileName);
                } catch (err) {
                    logger.error(`${this.controllerName}.${action} fileName ${fileName}, error = ${err}`);
                }
            },
            payload: {
                maxBytes: 1024100000,
                timeout: 11000000,
                output: 'file',
                uploads: uploadsFilePath,
            },
            timeout: {
                socket: 12000000,
            },
        };
    }
}

module.exports = new FileController();

