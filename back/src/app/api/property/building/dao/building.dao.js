'use strict';

const BaseDAO = require("../../../../core/base.dao");
const BuildingModel = require("../model/building.model");

module.exports = new BaseDAO(BuildingModel);