'use strict';

const Path = require('path');

const API_ROUTES = require("./api/api.routes");

const APP_ROUTES = [
    {
        method: 'GET',
        path: '/assets/img/{param*}',
        handler: {
            directory: { path: Path.normalize(__dirname + '/assets/img') },
        },
    },
    {
        method: 'GET',
        path: '/admin/{param*}',
        handler: {
            directory: { path: Path.normalize(__dirname + '/admin') },
        },
    },
    {
        method: 'POST',
        path: '/admin/{param*}',
        handler: {
            directory: { path: Path.normalize(__dirname + '/admin') },
        },
    },

    ...API_ROUTES
];
module.exports = APP_ROUTES;
