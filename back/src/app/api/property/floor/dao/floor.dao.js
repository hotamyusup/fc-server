'use strict';

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const FloorModel = require("../model/floor.model");

const FloorDAO = new PropertyChildrenBaseDAO(FloorModel);
module.exports = FloorDAO;