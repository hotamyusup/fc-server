'use strict';

const Promise = require("bluebird");
const moment = require("moment");
const _ = require("underscore");

const logger = require("../../../../core/logger");
const RedirectOnCreateController = require("../../../../core/redirect-on-create.controller");

const PropertyDAO = require("../dao/property.dao");
const BuildingDAO = require("../../building/dao/building.dao");
const FloorDAO = require("../../floor/dao/floor.dao");
const DeviceDAO = require("../../device/dao/device.dao");
const InspectionDAO = require("../../inspection/dao/inspection.dao");

class PropertyController extends RedirectOnCreateController {
    constructor() {
        super(PropertyDAO);
        this.controllerName = 'PropertyController';
        this.requestIDKey = 'PropertyID';
        this.batchEntitiesKey = 'properties';

        this.redirectUrl = '/property/';
    }


    get all() {
        const getPropertiesWithChildrenBuildings = () => {
            const mapToJSON = res => res.map(o => o.toJSON());
            return Promise
                .props({
                    Properties: PropertyDAO.all().then(mapToJSON),
                    Buildings: BuildingDAO.all().then(mapToJSON),
                })
                .then(({Properties, Buildings}) => {
                    _.forEach(Properties, property => {
                        property.Buildings = _.filter(Buildings, building => building.PropertyID.toString() === property._id.toString());
                    });
                    return Properties;
                }, {});
        };

        return {
            handler: (request, reply) => {
                this.handle('all', request, reply, getPropertiesWithChildrenBuildings());
            }
        }
    }


    get get() {
        const getPropertyWithTreeOfChildren = (PropertyID) => {
            const mapToJSON = res => res.map(o => o.toJSON());

            return Promise
                .props({
                    Property: PropertyDAO.get(PropertyID).then(o => o.toJSON()),
                    Buildings: BuildingDAO.forProperty(PropertyID).then(mapToJSON),
                    Floors: FloorDAO.forProperty(PropertyID).then(mapToJSON),
                    Devices: DeviceDAO.forProperty(PropertyID).then(mapToJSON),
                    Records: InspectionDAO.forProperty(PropertyID).then(mapToJSON),
                })
                .then(({Property, Buildings, Floors, Devices, Records}) => {
                    const convertToIdMap = (entities) => {
                        return entities.reduce((id2object, object) => {
                            id2object[object._id] = object;

                            if (object.DeviceID) {
                                const device = DeviceById[object.DeviceID];
                                if (device) {
                                    device.Records = device.Records || [];
                                    device.Records.push(object);
                                }
                            } else if (object.FloorID) {
                                object.Records = object.Records || [];
                                const floor = FloorById[object.FloorID];
                                if (floor) {
                                    floor.Devices = floor.Devices || [];
                                    floor.Devices.push(object);
                                }
                            } else if (object.BuildingID) {
                                object.Devices = object.Devices || [];
                                const building = BuildingById[object.BuildingID];
                                if (building) {
                                    building.Floors = building.Floors || [];
                                    building.Floors.push(object);
                                }
                            } else if (object.PropertyID) {
                                object.Floors = object.Floors || [];
                                const property = Property;
                                if (property) {
                                    property.Buildings = property.Buildings || [];
                                    property.Buildings.push(object);
                                }
                            }
                            return id2object;
                        }, {});
                    };

                    const BuildingById = convertToIdMap(Buildings);
                    const FloorById = convertToIdMap(Floors);
                    const DeviceById = convertToIdMap(Devices);
                    const RecordById = convertToIdMap(Records);

                    return Property;
                });
        };

        return {
            handler: (request, reply) => {
                this.handle('get', request, reply, getPropertyWithTreeOfChildren(request.params[this.requestIDKey]));
            }
        }
    }

    get
    processed() {
        const getPropertiesEntitiesFlat = () => {
            const mapToJSON = res => res.map(o => o.toJSON());

            return Promise
                .props({
                    Properties: PropertyDAO.all().then(mapToJSON),
                    Buildings: BuildingDAO.all().then(mapToJSON),
                    Floors: FloorDAO.all().then(mapToJSON),
                    Devices: DeviceDAO.all().then(mapToJSON),
                    Records: InspectionDAO.all().then(mapToJSON),
                })
                .then((response) => {
                    calculateRepairAndInspectState(
                        response.Properties,
                        response.Buildings,
                        response.Floors,
                        response.Devices,
                        response.Records
                    );

                    return response;
                });
        };

        return {
            handler: (request, reply) => {
                this.handle('processed', request, reply, getPropertiesEntitiesFlat());
            }
        }
    }
}

module.exports = new PropertyController();


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

    const PropertyById = convertToIdMap(Properties);
    const BuildingById = convertToIdMap(Buildings);
    const FloorById = convertToIdMap(Floors);

    const DeviceID2Inspections = {};
    const RecordById = Records.reduce((id2object, Record) => {
        id2object[Record._id] = Record;

        if (!DeviceID2Inspections[Record.DeviceID]) {
            DeviceID2Inspections[Record.DeviceID] = [];
        }

        DeviceID2Inspections[Record.DeviceID].push(Record);
        return id2object;
    }, {});

    for (let l = 0; l < Devices.length; l++) {
        const Device = Devices[l];
        const InstallDate = moment(Device.InstallationDate).format('YYYY-MM-DD');
        let LastFrequency;

        const Property = PropertyById[Device.PropertyID];
        const Building = BuildingById[Device.BuildingID];
        const Floor = FloorById[Device.FloorID];

        if (Property && Building && Floor) {
            Floor.Devices = Floor.Devices || [];
            Floor.Devices.push(Device._id);

            const deviceRecords = _.sortBy(DeviceID2Inspections[Device._id], 'InspectionDate').reverse();
            Device.Records = deviceRecords.map(record => record && record._id);

            if (Device.Status !== 2 && deviceRecords.length > 0 && deviceRecords[0]) {
                const LastRecord = deviceRecords[0];
                if (LastRecord.DeviceStatus == 1) {
                    Property.HasRepair = 1;
                    Building.HasRepair = 1;
                    Floor.HasRepair = 1;
                    Device.HasRepair = 1;
                    Property.RepairCount = Property.RepairCount || 0;
                    Property.RepairCount++;
                }
                LastFrequency = LastRecord.Frequency;
            } else {
                LastFrequency = -1;
            }

            if (Device.Status === 2) {
                Property.HasInspect = 1;
                Building.HasInspect = 1;
                Floor.HasInspect = 1;
                Device.HasInspect = 1;
                Property.InspectCount = Property.InspectCount || 0;
                Property.InspectCount++;
            } else if (LastFrequency != 1) {
                if ((InstallDate < Last && LastFrequency < 3) || (InstallDate < Annual && LastFrequency < 2) || (InstallDate < Semi && LastFrequency < 1) || (InstallDate < Quarter && LastFrequency < 0)) {
                    Property.HasInspect = 1;
                    Building.HasInspect = 1;
                    Floor.HasInspect = 1;
                    Device.HasInspect = 1;
                    Property.InspectCount = Property.InspectCount || 0;
                    Property.InspectCount++;
                }
            }
        } else {
            logger.error(`Wrong behaviour. Device ${Device._id} without ${JSON.stringify({
                Property: !!Property,
                Building: !!Building,
                Floor: !!Floor
            })}, ids: ${JSON.stringify({
                PropertyID: Device.PropertyID,
                BuildingID: Device.BuildingID,
                FloorID: Device.FloorID
            })}`);
        }

    }
};
