'use strict';

const Path = require('path');
const config = require('../config/config');
const API_ROUTES = require("./api/api.routes");

const APP_ROUTES = [
    {
        method: 'GET',
        path: '/admin/js/config-front.js',
        config: {
            auth: false,
            handler: async (request, reply) => {
                const configJSFileContent = `var configFront = ${JSON.stringify(config.front)};`;
                return reply(configJSFileContent).type('text/javascript');
            }
        },
    },
    {
        method: 'GET',
        path: '/admin/{param*}',
        config: {
            auth: false,
            handler: {
                directory: {path: Path.normalize(__dirname + '/../../../front/admin')},
            }
        },
    },
    {
        method: 'POST',
        path: '/admin/{param*}',
        config: {
            auth: false,
            handler: {
                directory: {path: Path.normalize(__dirname + '/../../../front/admin')},
            }
        },
    },

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
