'use strict';

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const InspectionModel = require("../model/inspection.model");

class InspectionDAO extends PropertyChildrenBaseDAO {
    constructor() {
        super(InspectionModel);
    }

    all() {
        return this.model.find({});
    }
}

module.exports = new InspectionDAO(InspectionModel);