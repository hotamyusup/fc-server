'use strict';

const Boom = require("boom");
const Promise = require("bluebird");
const moment = require("moment");
const _ = require("underscore");

const logger = require("../../../../core/logger");
const RedirectOnCreateController = require("../../../../core/redirect-on-create.controller");

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");
const PropertyFlattenerService = require("../service/property.flattener.service");


const PropertyDAO = require("../dao/property.dao");
const BuildingDAO = require("../../building/dao/building.dao");
const FloorDAO = require("../../floor/dao/floor.dao");
const DeviceDAO = require("../../device/dao/device.dao");
const InspectionDAO = require("../../inspection/dao/inspection.dao");

class PropertyController extends PropertyChildrenBaseController {
    constructor() {
        super(PropertyDAO);
        this.controllerName = 'PropertyController';
        this.requestIDKey = 'PropertyID';
        this.batchEntitiesKey = 'properties';

        this.redirectUrl = '/property/';
    }

    get all() {
        const getPropertiesWithChildrenBuildings = (conditions, options) => {
            const mapToJSON = res => res.map(o => o.toJSON());
            return Promise
                .props({
                    Properties: PropertyDAO.all(conditions, options).then(mapToJSON),
                    Buildings: BuildingDAO.all().then(mapToJSON),
                })
                .then(({Properties, Buildings}) => {
                    _.forEach(Properties, property => {
                        property.Buildings = _.filter(Buildings, building => `${building.PropertyID}` === `${property._id}`);
                    });
                    return Properties;
                }, {});
        };

        return {
            handler: async (request, reply) => {
                const {from, sort, limit, skip} = request.query;

                const options = {
                    sort: sort ? JSON.parse(decodeURIComponent(sort)) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    skip: skip ? parseInt(skip) : undefined
                };

                const conditions = {};
                if (from) {
                    conditions.updated_at = {
                        $gt: moment(from).toDate()
                    };
                }

                const user = request.auth && request.auth.credentials;
                if (user.Type === 'Customer') {
                    conditions.Organization = user.Organization;

                    const properties = await PropertyDAO.getPropertiesForPropertyManager(user._id);
                    const managedProperties = [...properties.map(property => property._id)];
                    if (managedProperties.length) {
                        conditions.PropertyID = {$in: managedProperties};
                    }
                }

                this.handle('all', request, reply, getPropertiesWithChildrenBuildings(conditions, options));
            }
        }
    }


    get get() {
        const getPropertyWithTreeOfChildren = async (Property, level) => {
            const PropertyID = Property._id;

            const levels = ['Property', 'Buildings', 'Floors', 'Devices', 'Records'];
            let levelValue = levels.indexOf(level);
            if (levelValue === -1) {
                levelValue = 42;
            }

            const mapToJSON = res => res.map(o => o.toJSON());
            return Promise
                .props({
                    Property,
                    Buildings: levelValue < 1 ? [] : BuildingDAO.forProperty(PropertyID).then(mapToJSON),
                    Floors: levelValue < 2 ? [] : FloorDAO.forProperty(PropertyID).then(mapToJSON),
                    Devices: levelValue < 3 ? [] : DeviceDAO.forProperty(PropertyID).then(mapToJSON),
                    Records: levelValue < 4 ? [] : InspectionDAO.forProperty(PropertyID).then(mapToJSON),
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
            handler: async (request, reply) => {
                const PropertyID = request.params[this.requestIDKey];
                const user = request.auth && request.auth.credentials;

                const Property = await PropertyDAO.get(PropertyID).then(o => o.toJSON());
                if (user.Type === 'Customer') {
                    if (`${Property.Organization}` !== `${user.Organization}`) {
                        return reply(Boom.forbidden(`User ${user && user.Title} dont have access to property ${PropertyID}`));
                    }
                }

                const {level} = request.query;

                this.handle('get', request, reply, getPropertyWithTreeOfChildren(Property, level));
            }
        }
    }

    get processed() {
        return {
            handler: (request, reply) => {
                const PropertyID = request.params[this.requestIDKey];

                this.handle('processed', request, reply, PropertyFlattenerService.getPropertiesFlatByIDs([PropertyID]).then(({Properties}) => Properties));
            }
        }
    }
}

module.exports = new PropertyController();


