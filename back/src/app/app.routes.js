'use strict';

const Path = require('path');
const API_ROUTES = require("./api/api.routes");
const FRONT_ROUTES = require("./front.routes");

const APP_ROUTES = [
    ...FRONT_ROUTES,
    ...API_ROUTES,
    {
        method: 'GET',
        path: '/{param*}',
        config: {
            auth: false,
            handler: {
                directory: {path: Path.normalize(__dirname + '../../public')}
            }
        }
    },
];

module.exports = APP_ROUTES;
