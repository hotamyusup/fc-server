'use strict';

const InspectionController = require("../controller/inspection.controller");

const INSPECTION_ROUTES = [
    {method: 'GET', path: '/records/', config: InspectionController.all},
    {method: 'GET', path: '/records/{InspectionID}', config: InspectionController.get},
    {method: 'POST', path: '/records', config: InspectionController.create},
    {method: 'POST', path: '/records/batch', config: InspectionController.batch},
];
module.exports = INSPECTION_ROUTES;
