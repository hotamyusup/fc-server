'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

const logger = require("../../../../core/logger");
const BaseDAO = require("../../../../core/base.dao");

const EquipmentModel = require("../model/equipment.model");
const EquipmentDeviceModel = require("../model/equipment-device.model");

class EquipmentDAO extends BaseDAO {
    constructor() {
        super(EquipmentModel);
    }

    async prepareUpdateObject(dataObject) {
        const preparedDataObject = await super.prepareUpdateObject(dataObject);
        return preparedDataObject;
    }

    upsertDevice(equipmentID, deviceID, deviceJSON) {
        return EquipmentModel
            .findOne({_id: equipmentID})
            .then(equipment => {
                const _Device = equipment.Devices.id(deviceID);
                if (!_Device) {
                    var device = new EquipmentDeviceModel(deviceJSON);
                    device.Status = 1;
                    equipment.Devices.push(device);
                } else {
                    _Device.Title = device.Title;
                    _Device.Status = device.Status;
                    _Device.Color = device.Color;
                }

                return equipment.save();
            });
    }
}

module.exports = new EquipmentDAO();
