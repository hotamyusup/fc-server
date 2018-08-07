'use strict';

const RedirectOnCreateController = require("../../../core/redirect-on-create.controller");
const FireSafetyDAO = require("../dao/fire-safety.document.dao");

class FireSafetyDocumentController extends RedirectOnCreateController {
    constructor() {
        super(FireSafetyDAO);
        this.controllerName = 'OrganizationController';
        this.requestIDKey = 'OrganizationID';
        this.batchEntitiesKey = 'floors';

        this.redirectUrl = '/organization/';
    }
}

module.exports = new FireSafetyDocumentController();