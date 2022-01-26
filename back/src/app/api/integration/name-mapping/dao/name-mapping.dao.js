'use strict';

const BaseDAO = require("../../../../core/base.dao");
const NameMappingModel = require("../model/name-mapping.model");

class NameMappingDao extends BaseDAO {
    constructor() {
        super(NameMappingModel);
    }
}

module.exports = new NameMappingDao();
