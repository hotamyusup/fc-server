'use strict';

const InspectionController = require("../controller/inspection.controller");

const INSPECTION_ROUTES = [
    {method: 'GET', path: '/records/', config: InspectionController.all},
    {method: 'GET', path: '/records/{InspectionID}', config: InspectionController.get},
    {method: 'POST', path: '/records', config: InspectionController.create},
    {method: 'POST', path: '/records/batch', config: InspectionController.batch},

    {method: 'GET', path: '/inspections/', config: InspectionController.all},
    {method: 'GET', path: '/inspections/{InspectionID}', config: InspectionController.get},
    {method: 'POST', path: '/inspections', config: InspectionController.create},
    {method: 'POST', path: '/inspections/batch', config: InspectionController.batch},
];
module.exports = INSPECTION_ROUTES;
