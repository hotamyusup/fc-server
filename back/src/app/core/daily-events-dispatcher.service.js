const Promise = require('bluebird');
const moment = require('moment-timezone');

const logger = require('./logger');

const NotificationService = require('../api/notification/service/notification.service');
const PropertyDAO = require('../api/property/property/dao/property.dao');
const BuildingDAO = require('../api/property/building/dao/building.dao');
const FloorDAO = require('../api/property/floor/dao/floor.dao');
const DeviceDAO = require('../api/property/device/dao/device.dao');
const EquipmentDAO = require("../api/property/device/dao/equipment.dao");
const InspectionDAO = require('../api/property/inspection/dao/inspection.dao');

class DailyEventsDispatcherService {
    constructor() {
        this.dailyEventsCache = {};
    }

    async onInspectionAdded(inspection, user) {
        console.log(`onInspectionAdded(${inspection._id})`);
        const {
            property,
            building,
            floor,
            device
        } = await Promise.props({
            property: PropertyDAO.get(inspection.PropertyID),
            building: BuildingDAO.get(inspection.BuildingID),
            floor: FloorDAO.get(inspection.FloorID),
            device: DeviceDAO.get(inspection.DeviceID),
        });

        const equipment = await EquipmentDAO.get(device.EquipmentType);
        const deviceType = equipment.Devices.id(device.DeviceType);

        // there weren't inspections today
        const inspectionStatus = parseInt(inspection.DeviceStatus) === 0 ? 'Passed' : 'Failed';
        NotificationService.notifyUsersByType('Admin', {
            title: `${property.Title} ${deviceType.Title} inspection ${inspectionStatus}!`,
            body: `${user.Title} inspected ${deviceType.Title} at ${moment(inspection.created_at).tz("America/Los_Angeles").format(`DD MMM hh:mm a`)}. Location:  ${property.Title} / ${building.Title} / ${floor.Title}`,
            ...{
                PropertyID: `${inspection.PropertyID}`,
                BuildingID: `${inspection.BuildingID}`,
                FloorID: `${inspection.FloorID}`,
                DeviceID: `${inspection.DeviceID}`,
                InspectionID: `${inspection._id}`,
            }
        });
    }
}

module.exports = new DailyEventsDispatcherService();

