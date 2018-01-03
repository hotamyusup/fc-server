/**
 * Created by Zeus on 09/03/16.
 */
var Hapi = require('hapi');
var server = new Hapi.Server();
var Routes = require('./routes');
var db = require('./misc/db');
var Inert = require('inert');

server.register(Inert, function () {
    server.connection({port: 8080,routes: { cors: true }});
    server.route(Routes.endpoints);
    //server.timeout = 120000;
    server.start(function(e) { console.log('Loud and clear: http://104.131.141.177') });
});

module.exports = server;
