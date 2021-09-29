'use strict';

const BaseDAO = require("../../../core/base.dao");
const InternalInventoryModel = require("../model/internal-inventory.model");

class InternalInventoryDAO extends BaseDAO {
    constructor() {
        super(InternalInventoryModel);
    }
}

module.exports = new InternalInventoryDAO();
