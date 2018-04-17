'use strict';

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const DeviceModel = require("../model/device.model");


class DeviceDAO extends PropertyChildrenBaseDAO {
    constructor() {
        super(DeviceModel);
    }

    findByQR(QRCode) {
        return this.model.findOne({QRCode});
    }
}

module.exports = new DeviceDAO();

