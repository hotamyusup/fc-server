'use strict';

const BaseDAO = require("../../../../core/base.dao");
const OccupancyTypeModel = require("../model/occupancy-type.model");

const OccupancyTypeDAO = new BaseDAO(OccupancyTypeModel);
module.exports = OccupancyTypeDAO;