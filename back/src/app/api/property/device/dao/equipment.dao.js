'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

const logger = require("../../../../core/logger");
const BaseDAO = require("../../../../core/base.dao");

const EquipmentModel = require("../model/equipment.model");
const EquipmentDeviceSchema = require("../model/equipment-device.schema");

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
                    var device = new EquipmentDeviceSchema(deviceJSON);
                    device.Status = 1;
                    equipment.Devices.push(device);
                } else {
                    _Device.Title = deviceJSON.Title;
                    _Device.Status = deviceJSON.Status;
                    _Device.Color = deviceJSON.Color;
                }

                return equipment.save();
            });
    }
}

module.exports = new EquipmentDAO();
