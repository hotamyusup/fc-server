'use strict';

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const InspectionModel = require("../model/inspection.model");

class InspectionDAO extends PropertyChildrenBaseDAO {
    constructor() {
        super(InspectionModel);
    }

    getInspectionsForDeviceID(DeviceID) {
        return this.model.find({DeviceID});
    }
}

module.exports = new InspectionDAO(InspectionModel);