'use strict';

const Promise = require('bluebird');
const Boom = require('boom');

const logger = require("../../../../core/logger");

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");

const BuildingDAO = require("../dao/building.dao");

class BuildingController extends PropertyChildrenBaseController {
    constructor() {
        super(BuildingDAO);
        this.controllerName = 'BuildingController';
        this.requestIDKey = 'BuildingID';
        this.batchEntitiesKey = 'buildings';
    }
}

module.exports = new BuildingController();
