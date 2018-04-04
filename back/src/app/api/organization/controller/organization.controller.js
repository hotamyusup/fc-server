'use strict';

const RedirectOnCreateController = require("../../../core/redirect-on-create.controller");
const OrganizationDAO = require("../dao/organization.dao");

class OrganizationController extends RedirectOnCreateController {
    constructor() {
        super(OrganizationDAO);
        this.controllerName = 'OrganizationController';
        this.requestIDKey = 'OrganizationID';
        this.batchEntitiesKey = 'floors';

        this.redirectUrl = '/organization/';
    }
}

module.exports = new OrganizationController();