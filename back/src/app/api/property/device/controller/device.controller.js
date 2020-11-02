'use strict';

const Promise = require('bluebird');

const logger = require("../../../../core/logger");

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");
const InspectionDAO = require("../../inspection/dao/inspection.dao");

const DeviceDAO = require("../dao/device.dao");
const DeviceDBExportService = require('../service/device.db-export.service');

class DeviceController extends PropertyChildrenBaseController {
    constructor() {
        super(DeviceDAO, DeviceDBExportService);
        this.controllerName = 'DeviceController';
        this.requestIDKey = 'DeviceID';
        this.batchEntitiesKey = 'devices';
    }

    get findByQR() {
        return {
            auth: false,
            handler: (request, reply) => {
                const getDeviceByQRCode = this.DAO.findByQR(request.params.QRCode)
                    .populate('PropertyID', {Title: 1, Map: 1})
                    .populate('BuildingID', {Title: 1})
                    .populate('FloorID', {Map: 1, Title: 1})
                    .populate('EquipmentType', {Title: 1, Devices: 1})
                    // .populate('DeviceType', {Title: 1})
                    .then(async device => {
                        if (device) {
                            device = device.toJSON();
                            if (device.PropertyID) {
                                device.Property = device.PropertyID;
                                device.PropertyID = device.Property._id;
                            }
                            if (device.BuildingID) {
                                device.Building = device.BuildingID;
                                device.BuildingID = device.Building._id;
                            }
                            if (device.FloorID) {
                                device.Floor = device.FloorID;
                                device.FloorID = device.Floor._id;
                            }
                            if (device.EquipmentType) {
                                const deviceTypeID = device.DeviceType;
                                const deviceType = (device.EquipmentType.Devices || []).filter(d => `${d._id}` == deviceTypeID)[0];
                                if (deviceType) {
                                    device.DeviceType = {Title: deviceType.Title, _id: deviceType._id};
                                }

                                delete device.EquipmentType.Devices;
                            }

                            device.Records = await InspectionDAO.getInspectionsForDeviceID(device._id).populate('User', {Title: 1});
                        }

                        return device || null;
                    });

                this.handle('findByQR', request, reply, getDeviceByQRCode);
            }
        };
    }
}

module.exports = new DeviceController();
