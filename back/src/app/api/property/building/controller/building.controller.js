'use strict';

const Promise = require('bluebird');
const Boom = require('boom');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const BuildingDAO = require("../dao/building.dao");

class BuildingController extends BaseController {
    constructor() {
        super(BuildingDAO);
        this.controllerName = 'BuildingController';
        this.requestIDKey = 'BuildingID';
        this.batchEntitiesKey = 'buildings';
    }
}

module.exports = new BuildingController();