'use strict';

const FloorController = require("../controller/floor.controller");

const FLOOR_ROUTES = [
    {method: 'GET', path: '/floors', config: FloorController.all},
    {method: 'GET', path: '/floors/{FloorID}', config: FloorController.get},
    {method: 'POST', path: '/floors', config: FloorController.upsert},
    {method: 'POST', path: '/floors/{FloorID}', config: FloorController.update},
    {method: 'POST', path: '/floors/batch', config: FloorController.batch},
    {method: 'POST', path: '/floors/getBatch', config: FloorController.getBatch},
    {method: 'POST', path: '/floors/duplicate', config: FloorController.duplicate},
];
module.exports = FLOOR_ROUTES;

