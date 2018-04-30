'use strict';
const logger = require('../../../core/logger');
const fs = require('fs');
const easyimg = require('easyimage');
const uuid = require('node-uuid');
const path = require('path');

class ImageController {
    constructor() {
        this.controllerName = 'ImageController';
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
        return {
            auth: false,
            handler: async(request, reply) => {
                const action = 'saveFile';
                logger.info(`${this.controllerName}.${action} start`);

                const file = request.payload.file;
                console.log('file === ', file);
                const filename = uuid.v4();

                const fileDirPath = path.normalize(__dirname + '/../public/file/');
                const filePath = fileDirPath + filename;

                fs.writeFile(filePath, file, (err) => {
                    if (err) {
                        logger.error(`${this.controllerName}.${action} write image file error: ${err}`);
                    }
                });

                logger.info(`${this.controllerName}.${action} finish`);
                return reply(filename);
            },
            payload: {
                maxBytes: 100000000,
                timeout: 11000000,
            },
            timeout: {
                socket: 12000000,
            },
        };
    }
}

module.exports = new ImageController();

