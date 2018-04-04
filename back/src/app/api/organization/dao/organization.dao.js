'use strict';

const BaseDAO = require("../../../core/base.dao");
const OrganizationModel = require("../model/organization.model");

module.exports = new BaseDAO(OrganizationModel);
