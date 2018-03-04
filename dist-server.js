/**
 * Created by Zeus on 09/03/16.
 */
const Hapi = require('hapi');
const Routes = require('./routes');
const Inert = require('inert');
const logger = require('./logger');
require('./misc/db');

const server = new Hapi.Server();

server.register(Inert, function() {
  server.connection({ port: 80, routes: { cors: true } });
  server.route(Routes.endpoints);
  // server.timeout = 120000;
  server.start(function() {
    logger.info('Loud and clear: http://104.131.141.177');
  });
});

module.exports = server;
