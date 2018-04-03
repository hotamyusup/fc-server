'use strict';

const Promise = require('bluebird');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const InspectionDAO = require("../dao/inspection.dao");

class InspectionController extends BaseController {
    constructor() {
        super(InspectionDAO);
        this.controllerName = 'InspectionController';
        this.requestIDKey = 'InspectionID';
        this.batchEntitiesKey = 'inspections';
    }
}

module.exports = new InspectionController();