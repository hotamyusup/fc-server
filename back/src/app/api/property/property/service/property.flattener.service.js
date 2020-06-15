'use strict';

const Boom = require("boom");
const Promise = require("bluebird");
const moment = require("moment");
const _ = require("underscore");

const logger = require("../../../../core/logger");


const PropertyDAO = require("../dao/property.dao");
const BuildingDAO = require("../../building/dao/building.dao");
const FloorDAO = require("../../floor/dao/floor.dao");
const DeviceDAO = require("../../device/dao/device.dao");
const InspectionDAO = require("../../inspection/dao/inspection.dao");

class PropertyFlattenerService {
    constructor() {
        this.controllerName = 'PropertyController';
        this.requestIDKey = 'PropertyID';
        this.batchEntitiesKey = 'properties';

        this.redirectUrl = '/property/';
    }

    async getPropertiesFlatByIDs(PropertyIDs) {
        let conditions = {Status: {$ne: -1}};
        let propertyConditions = {Status: {$ne: -1}};
        if (PropertyIDs && PropertyIDs.length) {
            conditions.PropertyID = {$in: PropertyIDs};
            propertyConditions._id = {$in: PropertyIDs};
        }

        return Promise
            .props({
                Properties: PropertyDAO.all(propertyConditions).then(mapToJSON),
                Buildings: BuildingDAO.all(conditions).then(mapToJSON),
                Floors: FloorDAO.all(conditions).then(mapToJSON),
                Devices: DeviceDAO.all(conditions).then(mapToJSON),
                Records: InspectionDAO.all(conditions).then(mapToJSON),
            })
            .then(({Properties, Buildings, Floors, Devices, Records}) => {
                calculateRepairAndInspectState(Properties, Buildings, Floors, Devices, Records);
                return {Properties, Buildings, Floors, Devices, Records};
            });

    }
}

module.exports = new PropertyFlattenerService();

const mapToJSON = res => res.map(o => o.toJSON());

const calculateRepairAndInspectState = (Properties, Buildings, Floors, Devices, Records) => {
    const Quarter = moment().subtract(3, 'months').format('YYYY-MM-DD');
    const Semi = moment().subtract(6, 'months').format('YYYY-MM-DD');
    const Annual = moment().subtract(1, 'years').format('YYYY-MM-DD');
    const Last = moment().subtract(5, 'years').format('YYYY-MM-DD');

    // main performance goal here - 1 loop per entity, only one

    const convertToIdMap = (entities) => {
        return entities.reduce((id2object, object) => {
            id2object[object._id] = object;

            if (object.DeviceID) {
                // ignore Inspection will be processed latter
            } else if (object.FloorID) {
                // ignore Device will be processed latter
            } else if (object.BuildingID) {
                const building = BuildingById[object.BuildingID];
                if (building) {
                    building.Floors = building.Floors || [];
                    building.Floors.push(object._id);
                }
            } else if (object.PropertyID) {
                const property = PropertyById[object.PropertyID];
                if (property) {
                    property.Buildings = property.Buildings || [];
                    property.Buildings.push(object._id);
                }
            }
            return id2object;
        }, {});
    };

    // order does matter
    const PropertyById = convertToIdMap(Properties);
    const BuildingById = convertToIdMap(Buildings);
    const FloorById = convertToIdMap(Floors);

    const DeviceID2Inspections = {};
    Records.forEach(Record => {
        if (!DeviceID2Inspections[Record.DeviceID]) {
            DeviceID2Inspections[Record.DeviceID] = [];
        }
        DeviceID2Inspections[Record.DeviceID].push(Record);
    });

    // add and increase InspectCount, RepairCount, HasInspect, HasRepair to entity
    const increaseField = (entity, field) => {
        const hasFieldName = `Has${field}`;
        entity[hasFieldName] = true;

        const counterFieldName = `${field}Count`;
        entity[counterFieldName] = entity[counterFieldName] || 0;
        entity[counterFieldName]++;
    }

    const increaseCounter = (field, Property, Building, Floor, Device) => {
        increaseField(Property, field);
        increaseField(Building, field);
        increaseField(Floor, field);
        increaseField(Device, field);
    }

    for (let l = 0; l < Devices.length; l++) {
        const Device = Devices[l];

        let LastFrequency;
        let LastInspectionDate;

        const Property = PropertyById[Device.PropertyID];
        const Building = BuildingById[Device.BuildingID];
        const Floor = FloorById[Device.FloorID];

        if (Property && Building && Floor) {
            Floor.Devices = Floor.Devices || [];
            Floor.Devices.push(Device._id);

            const deviceRecords = _.sortBy(DeviceID2Inspections[Device._id], 'InspectionDate').reverse();
            Device.Records = deviceRecords.map(record => record && record._id);

            const hasQRCode = parseInt(Device.QRCode) > 0;
            if (hasQRCode) {
                if (deviceRecords.length > 0 && deviceRecords[0]) {
                    const LastRecord = deviceRecords[0];

                    LastInspectionDate = moment(LastRecord.InspectionDate).format('YYYY-MM-DD');

                    if (Device.Status != 2) {
                        if (LastRecord.DeviceStatus == 1) {
                            // Property.RepairInspections = Property.RepairInspections || [];
                            // Property.RepairInspections.push(LastRecord);
                            increaseCounter('Repair', Property, Building, Floor, Device)
                        }
                        LastFrequency = parseInt(LastRecord.Frequency);
                    }

                } else {
                    LastFrequency = -1;
                }

                const isForcePendingDevice = parseInt(Device.Status) === 2;
                const isPendingDevice = parseInt(LastFrequency) === -1;

                if (isForcePendingDevice
                    || isPendingDevice
                    || (LastInspectionDate
                        && (((LastInspectionDate <= Last) && (LastFrequency === 3))
                            || ((LastInspectionDate <= Annual) && (LastFrequency === 2))
                            || ((LastInspectionDate <= Semi) && (LastFrequency === 1))
                            || ((LastInspectionDate <= Quarter) && (LastFrequency === 0))))
                ) {
                    increaseCounter('Inspect', Property, Building, Floor, Device);
                }
            }
        }
    }
};
