'use strict';

const moment = require('moment-timezone');

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const InspectionModel = require("../model/inspection.model");

class InspectionDAO extends PropertyChildrenBaseDAO {
    constructor() {
        super(InspectionModel);
    }

    getInspectionsForDeviceID(DeviceID) {
        return this.model.find({DeviceID});
    }

    getPropertyInspectionsForToday(PropertyID) {
        const nowInLA = moment().tz("America/Los_Angeles");
        const startOfDayDate = nowInLA.clone().startOf('day').toDate();
        const endOfDayDate = nowInLA.clone().endOf('day').toDate();

        return this.model.find({
            PropertyID,
            InspectionDate: {
                $gt: startOfDayDate,
                $lt: endOfDayDate
            }
        });
    }
}

module.exports = new InspectionDAO(InspectionModel);
