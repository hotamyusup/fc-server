'use strict';

const Promise = require('bluebird');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const FloorDAO = require("../dao/floor.dao");

class FloorController extends BaseController {
    constructor() {
        super(FloorDAO);
        this.controllerName = 'FloorController';
        this.requestIDKey = 'FloorID';
        this.batchEntitiesKey = 'floors';
    }
}

module.exports = new FloorController();