'use strict';

const Path = require('path');

const API_ROUTES = require("./api/api.routes");

const APP_ROUTES = [
    {
        method: 'GET',
        path: '/admin/{param*}',
        config:{
            auth: false,
            handler: {
                directory: { path: Path.normalize(__dirname + '/../../../front/admin') },
            }
        },
    },
    {
        method: 'POST',
        path: '/admin/{param*}',
        config: {
            auth: false,
            handler: {
                directory: { path: Path.normalize(__dirname + '/../../../front/admin') },
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
                directory: {  path: Path.normalize(__dirname + '../../public')  }
            }
        }
    },

];
module.exports = APP_ROUTES;
