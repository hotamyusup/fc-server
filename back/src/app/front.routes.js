'use strict';

const Path = require('path');
const config = require('../config/config');

const FRONT_ROUTES = [
    {
        // Dynamic front-end config.js file, to have only one `dist-` config file stored in backend in future
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
        path: '/manifest.json',
        config: {
            auth: false,
            handler: async (request, reply) => {
                const configJSFileContent = `
                {
                    "gcm_sender_id": "${config.front.firebase.messagingSenderId}"
                }
                `;
                return reply(configJSFileContent).type('application/json');
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
];

module.exports = FRONT_ROUTES;
