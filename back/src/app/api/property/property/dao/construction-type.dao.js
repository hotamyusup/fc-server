'use strict';

const BaseDAO = require("../../../../core/base.dao");
const ConstructionTypeModel = require("../model/construction-type.model");

const ConstructionTypeDAO = new BaseDAO(ConstructionTypeModel);
module.exports = ConstructionTypeDAO;