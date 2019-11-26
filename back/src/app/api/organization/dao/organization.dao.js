'use strict';

const BaseDAO = require("../../../core/base.dao");
const OrganizationModel = require("../model/organization.model");

class OrganizationDAO extends BaseDAO {
    constructor() {
        super(OrganizationModel);
    }

    async isActive(organizationID) {
        const organization = await this.get(organizationID);
        return organization && organization.Active;
    }
}

module.exports = new OrganizationDAO();
