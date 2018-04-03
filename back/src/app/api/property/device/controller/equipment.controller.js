'use strict';

const Promise = require('bluebird');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const EquipmentDAO = require("../dao/equipment.dao");

class EquipmentController extends BaseController {
    constructor() {
        super(EquipmentDAO);
        this.controllerName = 'EquipmentController';
        this.requestIDKey = 'EquipmentID';
        this.batchEntitiesKey = 'devices';
    }

    get upsertDevice() {
        return {
            handler: (request, reply) => this.handle('upsertDevice', request, reply, this.DAO.upsertDevice(request.params.EquipmentID, request.params.DeviceID, request.payload))
        }
    }
}

module.exports = new EquipmentController();