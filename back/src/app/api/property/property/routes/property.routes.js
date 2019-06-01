'use strict';

const PropertyController = require("../controller/property.controller");

const PROPERTY_ROUTES = [
    {method: 'GET', path: '/properties/processed', config: PropertyController.processed},
    {method: 'POST', path: '/properties', config: PropertyController.upsert},
    // {method: 'GET', path: '/properties/processed', config: PropertyController.processed},
    {method: 'POST', path: '/properties/{PropertyID}', config: PropertyController.update},
    {method: 'POST', path: '/properties/batch', config: PropertyController.batch},
    {method: 'POST', path: '/properties/getBatch', config: PropertyController.getBatch},
    {method: 'GET', path: '/properties', config: PropertyController.all},
    {method: 'GET', path: '/properties/{PropertyID}', config: PropertyController.get}
];

module.exports = PROPERTY_ROUTES;
