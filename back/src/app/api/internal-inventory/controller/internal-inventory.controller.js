'use strict';

const BaseController = require("../../../core/base.controller");
const InternalInventoryDAO = require("../dao/internal-inventory.dao");

class InternalInventoryController extends BaseController {
    constructor() {
        super(InternalInventoryDAO);
        this.controllerName = 'InternalInventoryController';
        this.requestIDKey = 'InventoryID';
        this.batchEntitiesKey = 'inventory';
    }
}

module.exports = new InternalInventoryController();