'use strict';

const BaseController = require("../../../../core/base.controller");
const NameMappingDAO = require("../dao/name-mapping.dao");

class NameMappingController extends BaseController {
    constructor() {
        super(NameMappingDAO);
        this.controllerName = 'NameMappingController';
        this.requestIDKey = 'NameMappingID';
        this.batchEntitiesKey = 'namemapping';
    }
}

module.exports = new NameMappingController();