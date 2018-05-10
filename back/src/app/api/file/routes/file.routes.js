'use strict';

const FileController = require("../controller/file.controller");

const FILE_ROUTES = [
    {method: 'GET', path: '/file/{param*}', config: FileController.get},
    {method: 'POST', path: '/file', config: FileController.save},
];

module.exports = FILE_ROUTES;
