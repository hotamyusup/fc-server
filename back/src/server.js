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
const config = require('./config/config');
require('./config/db');


const APP_ROUTES = require("./app/app.routes");

const server = new Hapi.Server();

const start = async() => {
    logger.info('Fire Cloud server starting...');

    await server.register(Inert);

    server.connection({port: config.server.port, routes: {cors: true}});
    server.route(APP_ROUTES);

    await server.start();

    logger.info('Server is listening: ' + server.info.uri);
};

start();

module.exports = server;
