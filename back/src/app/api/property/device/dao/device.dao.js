'use strict';

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const DeviceModel = require("../model/device.model");


class DeviceDAO extends PropertyChildrenBaseDAO {
    constructor() {
        super(DeviceModel);
    }

    create(dataObject) {
        return super.create(cleanPSI(dataObject));
    }

    async update(dataObject, upsert) {
        return super.update(cleanPSI(dataObject), upsert);
    }

    upsert(dataObject) {
        return super.upsert(cleanPSI(dataObject));
    }

    findByQR(QRCode) {
        return this.model.findOne({QRCode});
    }
}

module.exports = new DeviceDAO();

function cleanPSI(dataObject) {
    if (dataObject && dataObject.PSI && isNaN(dataObject.PSI)) {
        delete dataObject.PSI;
    }

    return dataObject;
}
