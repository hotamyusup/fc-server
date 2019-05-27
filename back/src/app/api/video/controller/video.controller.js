'use strict';
const logger = require('../../../core/logger')
const fs = require('fs');
const easyimg = require('easyimage');
const uuid = require('node-uuid');
const path = require('path');

const publicVideoDir = path.normalize(__dirname + '/../public/video');
const BaseController = require("../../../../app/core/base.controller");
const VideoDAO = require("../dao/video.dao");

class VideoController extends BaseController {
    constructor() {
    	super(VideoDAO);
        this.controllerName = 'VideoController';
        this.batchEntitiesKey = 'videos'
    }

    get getFile() {
		return {
            auth: false,
            handler: {
                directory: {path: publicVideoDir},
            }
        }
    }

    get storeFile() {
        return {
            auth: false,
            handler: async(request, reply) => {
                const action = 'storeFile';
                logger.info(`${this.controllerName}.${action} start`);

                const video = request.payload.media;
                const filename = `${uuid.v4()}.mp4`;

                const videoPath = publicVideoDir + '/'+ filename;
                // const videoPath = publicVideoDir + filename + '.jpg';
                // const tumbPath = publicVideoDir + filename + '-t.jpg';

                fs.writeFile(videoPath, video, function (err) {
                    if (err) {
                        logger.error(`${this.controllerName}.${action} write image file error: ${err}`);
                    }
                });

                // const Thumbnail = await easyimg.thumbnail({
                //     src: videoPath,
                //     dst: tumbPath,
                //     width: 250,
                //     height: 250,
                //     quality: 100,
                // }).catch(thumbErr => {
                //     logger.error(`${this.controllerName}.${action} creating thumbnail error: ${thumbErr}`);
                // });
                //fs.unlink("./img/temp-"+filename+".jpg");

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

module.exports = new VideoController();

