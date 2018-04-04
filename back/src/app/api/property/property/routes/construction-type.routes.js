'use strict';

const ConstructionTypeController = require("../controller/construction-type.controller");

const CONSTRUCTION_TYPE_ROUTES = [
    {method: 'GET', path: '/constructiontypes', config: ConstructionTypeController.all},
    {method: 'GET', path: '/constructiontypes/{ConstructionTypeID}', config: ConstructionTypeController.get},
    {method: 'POST', path: '/constructiontypes', config: ConstructionTypeController.create},
    {method: 'POST', path: '/constructiontypes/{ConstructionTypeID}', config: ConstructionTypeController.update},
];

module.exports = CONSTRUCTION_TYPE_ROUTES;
