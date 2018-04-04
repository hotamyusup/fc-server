'use strict';

const OccupancyTypeController = require("../controller/occupancy-type.controller");

const OCCUPANCY_TYPE_ROUTES = [
    {method: 'GET', path: '/occupancytypes', config: OccupancyTypeController.all},
    {method: 'GET', path: '/occupancytypes/{OccupancyTypeID}', config: OccupancyTypeController.get},
    {method: 'POST', path: '/occupancytypes', config: OccupancyTypeController.create},
    {method: 'POST', path: '/occupancytypes/{OccupancyTypeID}', config: OccupancyTypeController.update},
];

module.exports = OCCUPANCY_TYPE_ROUTES;
