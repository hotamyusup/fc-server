'use strict';

const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");
const DeviceModel = require("../model/device.model");

module.exports = new PropertyChildrenBaseDAO(DeviceModel);