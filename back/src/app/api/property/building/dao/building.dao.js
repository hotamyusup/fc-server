'use strict';

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const BuildingModel = require("../model/building.model");

const BuildingDAO = new PropertyChildrenBaseDAO(BuildingModel);
module.exports = BuildingDAO;