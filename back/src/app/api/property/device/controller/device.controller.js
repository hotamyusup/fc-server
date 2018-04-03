'use strict';

const Promise = require('bluebird');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const DeviceDAO = require("../dao/device.dao");

class DeviceController extends BaseController {
    constructor() {
        super(DeviceDAO);
        this.controllerName = 'DeviceController';
        this.requestIDKey = 'DeviceID';
        this.batchEntitiesKey = 'devices';
    }
}

module.exports = new DeviceController();