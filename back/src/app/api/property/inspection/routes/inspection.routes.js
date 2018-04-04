'use strict';

const InspectionController = require("../controller/inspection.controller");

const INSPECTION_ROUTES = [
    {method: 'POST', path: '/records', config: InspectionController.create},
    {method: 'POST', path: '/records/batch', config: InspectionController.batch},
];
module.exports = INSPECTION_ROUTES;
