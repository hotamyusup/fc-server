'use strict';

const ServiceController = require("../controller/service.controller");

const SERVICE_ROUTES = [
    {method: 'POST', path: '/service', config: ServiceController.send},
    {method: 'GET', path: '/service', config: ServiceController.send},
];

module.exports = SERVICE_ROUTES;
