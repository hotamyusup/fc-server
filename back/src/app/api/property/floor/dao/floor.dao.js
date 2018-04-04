'use strict';

const BaseDAO = require("../../../../core/base.dao");
const FloorModel = require("../model/floor.model");

const FloorDAO = new BaseDAO(FloorModel);
module.exports = FloorDAO;