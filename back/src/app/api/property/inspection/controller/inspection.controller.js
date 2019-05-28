'use strict';

const Promise = require('bluebird');

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");
const logger = require("../../../../core/logger");

const InspectionDAO = require("../dao/inspection.dao");

class InspectionController extends PropertyChildrenBaseController {
    constructor() {
        super(InspectionDAO);
        this.controllerName = 'InspectionController';
        this.requestIDKey = 'InspectionID';
        this.batchEntitiesKey = 'inspections';
    }
}

module.exports = new InspectionController();
