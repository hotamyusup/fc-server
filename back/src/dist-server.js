/**
 * Created by Zeus on 09/03/16.
 */

const Hapi = require('hapi');
const Routes = require('./routes');
const Inert = require('inert');
const logger = require('./logger');
const config = require('./misc/config');
require('./misc/db');

//console.log(config.server.url);

const server = new Hapi.Server();

server.register(Inert, function() {
  server.connection({ port: config.server.port, routes: { cors: true } });
  server.route(Routes.endpoints);
  // server.timeout = 120000;
  server.start(function() {
    logger.info('Server is listening: ' + config.server.url);
  });
});

module.exports = server;
