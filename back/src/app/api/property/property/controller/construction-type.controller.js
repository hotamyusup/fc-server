'use strict';

const RedirectOnCreateController = require("../../../../core/redirect-on-create.controller");
const ConstructionTypeDAO = require("../dao/construction-type.dao");

class ConstructionTypeController extends RedirectOnCreateController {
    constructor() {
        super(ConstructionTypeDAO);
        this.controllerName = 'ConstructionTypeController';
        this.requestIDKey = 'ConstructionTypeID';
        this.batchEntitiesKey = '';

        this.redirectUrl = '/constructiontype/';
    }
}

module.exports = new ConstructionTypeController();