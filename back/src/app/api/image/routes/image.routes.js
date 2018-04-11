'use strict';

const ImageController = require("../controller/image.controller");

const IMAGE_ROUTES = [
    {method: 'GET', path: '/img/{param*}', config: ImageController.get},
    {method: 'POST', path: '/image', config: ImageController.save}
];

module.exports = IMAGE_ROUTES;
