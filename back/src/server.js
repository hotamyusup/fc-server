'use strict';

console.log('+++++++++++++++++++++++++++++++++++++-+-+-+-+-+-+-+-+-+-+++++++++++++++++++++++++++++++++++++');
console.log('++++++++++++++++++++++++++++++++++++|F|I|R|E|_|C|L|O|U|D|++++++++++++++++++++++++++++++++++++');
console.log('+++++++++++++++++++++++++++++++++++++-+-+-+-+-+-+-+-+-+-+++++++++++++++++++++++++++++++++++++');
console.log('++++++++++++++++++++++++++++++++++++|A|P|P|_|_|S|T|A|R|T|++++++++++++++++++++++++++++++++++++');
console.log('+++++++++++++++++++++++++++++++++++++-+-+-+-+-+-+-+-+-+-+++++++++++++++++++++++++++++++++++++');
console.log('\n\n');

const Hapi = require('hapi');
const Inert = require('inert');

const logger = require('./app/core/logger');
const hashAuth = require('./app/core/hash-auth-server-plugin');
const config = require('./config/config');
require('./config/db');

const APP_ROUTES = require("./app/app.routes");
require("./app/app.schedule");

const server = new Hapi.Server({
    connections: {
        routes: {
            timeout: {
                server: 1000 * 60 * 5,
                socket: 1000 * 60 * 8
            }
        }
    }
});

const start = async() => {
    logger.info('Fire Cloud server starting...');

    await server.register(Inert);

    server.connection({port: config.server.port, routes: {cors: true}});
    server.route(APP_ROUTES);

    await server.register(hashAuth);
    server.auth.strategy('simple', 'hash');
    server.auth.default('simple');

    await server.start();

    logger.info('Server is listening: ' + server.info.uri);
};

start();

module.exports = server;
