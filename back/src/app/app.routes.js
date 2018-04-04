'use strict';

const Path = require('path');

const API_ROUTES = require("./api/api.routes");

console.log('__dirname === ', __dirname);
const APP_ROUTES = [
    {
        method: 'GET',
        path: '/assets/img/{param*}',
        handler: {
            directory: { path: Path.normalize(__dirname + '../public/assets/img') },
        },
    },
    {
        method: 'GET',
        path: '/admin/{param*}',
        handler: {
            directory: { path: Path.normalize(__dirname + '/../../../front/admin') },
        },
    },
    {
        method: 'POST',
        path: '/admin/{param*}',
        handler: {
            directory: { path: Path.normalize(__dirname + '/../../../front/admin') },
        },
    },

    ...API_ROUTES
];
module.exports = APP_ROUTES;
