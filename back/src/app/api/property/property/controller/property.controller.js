'use strict';

const RedirectOnCreateController = require("../../../../core/redirect-on-create.controller");
const PropertyDAO = require("../dao/property.dao");

class PropertyController extends RedirectOnCreateController {
    constructor() {
        super(PropertyDAO);
        this.controllerName = 'PropertyController';
        this.requestIDKey = 'PropertyID';
        this.batchEntitiesKey = 'properties';

        this.redirectUrl = '/property/';
    }
}

module.exports = new PropertyController();
