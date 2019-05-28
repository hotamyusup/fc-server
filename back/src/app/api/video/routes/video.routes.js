'use strict';

const VideoController = require("../controller/video.controller");

const IMAGE_ROUTES = [
    {method: 'GET', path: '/video/{param*}', config: VideoController.getFile},
    {method: 'POST', path: '/video', config: VideoController.storeFile},

    {method: 'GET', path: '/videos', config: VideoController.all},
    {method: 'POST', path: '/videos/batch', config: VideoController.batch},
    {method: 'GET', path: '/videos/{VideoID}', config: VideoController.get},
    {method: 'POST', path: '/videos/{VideoID}', config: VideoController.update},
    {method: 'POST', path: '/videos', config: VideoController.create},
];

module.exports = IMAGE_ROUTES;
