'use strict';

const BuildingController = require("../controller/building.controller");

const BUILDING_ROUTES = [
    {method: 'POST', path: '/buildings', config: BuildingController.upsert},
    {method: 'POST', path: '/buildings/{BuildingID}', config: BuildingController.update},
    {method: 'POST', path: '/buildings/batch', config: BuildingController.batch},
];

module.exports = BUILDING_ROUTES;
