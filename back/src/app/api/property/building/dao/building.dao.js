'use strict';

const BaseDAO = require("../../../../core/base.dao");
const BuildingModel = require("../model/building.model");

const buildingDAO = new BaseDAO(BuildingModel);
module.exports = buildingDAO;