'use strict';

const BaseDAO = require("../../../core/base.dao");
const OrganizationModel = require("../model/organization.model");

const OrganizationDAO = new BaseDAO(OrganizationModel);
module.exports = OrganizationDAO;
