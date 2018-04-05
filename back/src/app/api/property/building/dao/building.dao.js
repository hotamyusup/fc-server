'use strict';

const BaseDAO = require("../../../../core/base.dao");
const BuildingModel = require("../model/building.model");

const BuildingDAO = new BaseDAO(BuildingModel);
module.exports = BuildingDAO;