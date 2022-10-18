'use strict';
const logger = require("../../../../core/logger");

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");
const InspectionDAO = require("../../inspection/dao/inspection.dao");
const PropertyDAO = require("../../property/dao/property.dao");

const DeviceDAO = require("../dao/device.dao");
const DeviceModel = require("../model/device.model");
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

    get alarmData() {
        return {
            auth: false,
            handler: async (request, reply) => {
                let result = true;

                try {
                    if (!Array.isArray(request.payload)) {
                        throw new Error(`${AlarmDataErrPrefix}: data not array`);
                    }

                    const promises = request.payload.map(async (alarmItem) => {
                        try {
                            // match alarmItem.siteName to Property.title and alarmItem.zoneId to device.AlarmZone
                            const propIds = (await PropertyDAO.getByTitle(alarmItem.siteName))
                                .map(prop => prop._id);

                            if (propIds.length === 0) {
                                throw new Error(`not found property "${alarmItem.siteName}"`);
                            }

                            const result = await DeviceModel.update(
                                {
                                    PropertyID: propIds,
                                    AlarmZone: alarmItem.zoneId
                                },
                                { $set: { AlarmStatus: alarmItem.event }},
                                { multi: true }
                            );

                            if (result.ok !== 1 || result.nModified === 0) {
                                const errMsg = `Property "${alarmItem.siteName}", zone "${alarmItem.zoneId}". Set alarm status "${alarmItem.event}": ${(result.ok !== 1) ? 'update failed' : '0 updated records'}`
                                throw new Error(errMsg);
                            }
                        } catch (err) {
                            logger.error('Alarm data error:' + err.message);
                        }
                    });

                    await Promise.all(promises);

                } catch (err) {
                    logger.error('Alarm data error:' + err.message);
                    result = false;
                }

                return this.handle('alarmData', request, reply, result);
            }
        };
    }
}

module.exports = new DeviceController();
