'use strict';
const Path = require('path');

const ImageController = require("../controller/image.controller");

const IMAGE_ROUTES = [
    {
        method: 'GET',
        path: '/img/{param*}',
        handler: {
            directory: {path: Path.normalize(__dirname + '/img')},
        },
    },

    {method: 'POST', path: '/image', config: ImageController.save}
];

module.exports = IMAGE_ROUTES;
