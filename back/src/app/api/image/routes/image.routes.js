'use strict';

const ImageController = require("../controller/image.controller");

const IMAGE_ROUTES = [
    {method: 'GET', path: '/image/generate-thumbnail/{imageName*}', config: ImageController.generateThumbForImage},
    {method: 'GET', path: '/img/{param*}', config: ImageController.get},
    {method: 'POST', path: '/image', config: ImageController.save}
];

module.exports = IMAGE_ROUTES;
