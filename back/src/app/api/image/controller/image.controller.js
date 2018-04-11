'use strict';
const logger = require('../../../core/logger')
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
                directory: {path: path.normalize(__dirname + '/../public/img')},
            }
        }
    }

    get save() {
        return {
            auth: false,
            handler: async(request, reply) => {
                const action = 'save';
                logger.info(`${this.controllerName}.${action} start`);

                const Photo = request.payload.Photo;
                const filename = uuid.v4();

                const imagesDirPath = path.normalize(__dirname + '/../public/img/');
                const imagePath = imagesDirPath + filename + '.jpg';
                const tumbPath = imagesDirPath + filename + '-t.jpg';

                fs.writeFile(imagePath, Photo, function (err) {
                    if (err) {
                        logger.error(`${this.controllerName}.${action} write image file error: ${err}`);
                    }
                });

                const Thumbnail = await easyimg.thumbnail({
                    src: imagePath,
                    dst: tumbPath,
                    width: 250,
                    height: 250,
                    quality: 100,
                }).catch(thumbErr => {
                    logger.error(`${this.controllerName}.${action} creating thumbnail error: ${thumbErr}`);
                });
                //fs.unlink("./img/temp-"+filename+".jpg");

                return reply(filename + '.jpg');
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

