'use strict';

const BaseDAO = require("../../../../core/base.dao");
const DeviceModel = require("../model/device.model");

module.exports = new BaseDAO(DeviceModel);