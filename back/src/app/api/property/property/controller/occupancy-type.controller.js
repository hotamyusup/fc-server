'use strict';

const RedirectOnCreateController = require("../../../../core/redirect-on-create.controller");
const OccupancyTypeDAO = require("../dao/occupancy-type.dao");

class OccupancyTypeController extends RedirectOnCreateController {
    constructor() {
        super(OccupancyTypeDAO);
        this.controllerName = 'OccupancyTypeController';
        this.requestIDKey = 'OccupancyTypeID';
        this.batchEntitiesKey = '';

        this.redirectUrl = 'occupancytype';
    }
}

module.exports = new OccupancyTypeController();