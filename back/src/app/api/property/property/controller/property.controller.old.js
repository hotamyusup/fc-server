/**
 * Created by Zeus on 09/03/16.
 */

const Boom = require('boom');
const geocoder = require('node-geocoder')('google', 'http');
const {Property} = require('../schema/property');
const {User} = require('../schema/user');
const async = require('async');
const logger = require('../logger');
const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
import {PropertyDAO} from "../dao/property.dao";

const {db, Mongoose} = require('../misc/db');

const cache = {};
const {isAuthorized} = require('../user-access');



const getProperties = function () {
    console.time('getProperties');
    return (
        new Promise((resolve, reject) => {
            const data = [];
            Property
                .aggregate([
                    {$match: {Status: {$gt: -1}}},
                    {$addFields: {"Buildings": "$Buildings._id"}}
                ])
                .cursor({})
                .exec()
                .on('data', doc => data.push(doc))
                .on('end', () => resolve(data))
        }))
        .then(properties => {
            // console.timeEnd('getProperties');
            // console.log('properties.length = ' + properties.length)
            return properties;
        });
};
const getBuildings = function () {
    console.time('getBuildings');
    return (
        new Promise((resolve, reject) => {
            const data = [];
            Property
                .aggregate([
                    {$match: {"Status": {$gt: -1}}},
                    {$unwind: "$Buildings"},
                    {$match: {"Buildings.Status": {$gt: -1}}},
                    {
                        $addFields: {
                            "Buildings.PropertyID": "$_id",
                            "Buildings.Floors": "$Buildings.Floors._id"
                        }
                    },
                    {$replaceRoot: {newRoot: "$Buildings"}}
                ])
                .cursor({})
                .exec()
                .on('data', doc => data.push(doc))
                .on('end', () => resolve(data))
        }))
        .then(buildings => {
            // console.timeEnd('getBuildings');
            // console.log('buildings.length = ' + buildings.length)
            return buildings;
        });
};
const getFloors = function () {
    console.time('getFloors');
    return (
        new Promise((resolve, reject) => {
            const data = [];
            Property
                .aggregate([
                    {$match: {"Status": {$gt: -1}}},
                    {$unwind: "$Buildings"},
                    {$match: {"Buildings.Status": {$gt: -1}}},
                    {$unwind: "$Buildings.Floors"},
                    {$match: {"Buildings.Floors.Status": {$gt: -1}}},
                    {
                        $addFields: {
                            "Buildings.Floors.PropertyID": "$_id",
                            "Buildings.Floors.BuildingID": "$Buildings._id",
                            "Buildings.Floors.Devices": "$Buildings.Floors.Devices._id"
                        }
                    },
                    {$replaceRoot: {newRoot: "$Buildings.Floors"}}
                ])
                .cursor({})
                .exec()
                .on('data', doc => data.push(doc))
                .on('end', () => resolve(data))
        }))
        .then(floors => {
            // console.timeEnd('getFloors');
            // console.log('floors.length = ' + floors.length)
            return floors;
        })
};
const getDevices = function () {
    console.time('getDevices');
    return (
        new Promise((resolve, reject) => {
            const data = [];
            Property
                .aggregate([
                    {$match: {Status: {$gt: -1}}},
                    {$unwind: "$Buildings"},
                    {$match: {"Buildings.Status": {$gt: -1}}},
                    {$unwind: "$Buildings.Floors"},
                    {$match: {"Buildings.Floors.Status": {$gt: -1}}},
                    {$unwind: "$Buildings.Floors.Devices"},
                    {$match: {"Buildings.Floors.Devices.Status": {$gt: -1}}},
                    {
                        $addFields: {
                            "Buildings.Floors.Devices.PropertyID": "$_id",
                            "Buildings.Floors.Devices.BuildingID": "$Buildings._id",
                            "Buildings.Floors.Devices.FloorID": "$Buildings.Floors._id",
                            "Buildings.Floors.Devices.Records": "$Buildings.Floors.Devices.Records._id"
                        }
                    },
                    {$replaceRoot: {newRoot: "$Buildings.Floors.Devices"}}
                ])
                .cursor({})
                .exec()
                .on('data', doc => data.push(doc))
                .on('end', () => resolve(data))
        }))
        .then(devices => {
            // console.timeEnd('getDevices');
            // console.log('devices.length = ' + devices.length)
            return devices;
        })
};
const getRecords = function () {
    console.time('getRecords');
    return (
        new Promise((resolve, reject) => {
            const data = [];
            Property
                .aggregate([
                    {$match: {"Status": {$gt: -1}}},
                    {$unwind: "$Buildings"},
                    {$match: {"Buildings.Status": {$gt: -1}}},
                    {$unwind: "$Buildings.Floors"},
                    {$match: {"Buildings.Floors.Status": {$gt: -1}}},
                    {$unwind: "$Buildings.Floors.Devices"},
                    {$match: {"Buildings.Floors.Devices.Status": {$gt: -1}}},
                    {$unwind: "$Buildings.Floors.Devices.Records"},
                    {
                        $addFields: {
                            "Buildings.Floors.Devices.Records.PropertyID": "$_id",
                            "Buildings.Floors.Devices.Records.BuildingID": "$Buildings._id",
                            "Buildings.Floors.Devices.Records.FloorID": "$Buildings.Floors._id",
                            "Buildings.Floors.Devices.Records.DeviceID": "$Buildings.Floors.Devices._id"
                        }
                    },
                    {$replaceRoot: {newRoot: "$Buildings.Floors.Devices.Records"}}
                ])
                .cursor({})
                .exec()
                .on('data', doc => data.push(doc))
                .on('end', () => resolve(data))
        }))
        .then(records => {
            // console.timeEnd('getRecords');
            // console.log('records.length = ' + records.length)
            return records;
        })
};
const calculateRepairAndInspectState = (Properties, Buildings, Floors, Devices, Records)=> {
    const Quarter = moment().subtract(3, 'months').format('YYYY-MM-DD');
    const Semi    = moment().subtract(6, 'months').format('YYYY-MM-DD');
    const Annual  = moment().subtract(1, 'years').format('YYYY-MM-DD');
    const Last    = moment().subtract(5, 'years').format('YYYY-MM-DD');

    const convertToIdMap = (id2object, object)=> {
        let objectId = object._id.toString();
        id2object[objectId] = object;
        object._id = objectId;
        return id2object;
    };

    const PropertyById = Properties.reduce(convertToIdMap, {});
    const BuildingById = Buildings.reduce(convertToIdMap, {});
    const FloorById    = Floors.reduce(convertToIdMap, {});
    const RecordById   = Records.reduce(convertToIdMap, {});

    for (let l = 0; l < Devices.length; l++) {
        const Device = Devices[l];
        const InstallDate = moment(Device.InstallationDate).format('YYYY-MM-DD');
        let LastFrequency;

        const Property  = PropertyById[Device.PropertyID];
        const Building  = BuildingById[Device.BuildingID];
        const Floor     = FloorById[Device.FloorID];

        if (Property && Building && Floor) {
            const deviceRecords = _.sortBy(Device.Records.map(recordId => RecordById[recordId.toString()]), 'InspectionDate').reverse();

            if (deviceRecords.length > 0 && deviceRecords[0]) {
                const LastRecord = deviceRecords[0];
                if (LastRecord.DeviceStatus == 1) {
                    Property.HasRepair  = 1;
                    Building.HasRepair  = 1;
                    Floor.HasRepair     = 1;
                    Device.HasRepair    = 1;
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
                    Floor.HasInspect    = 1;
                    Device.HasInspect   = 1;
                    Property.InspectCount = Property.InspectCount || 0;
                    Property.InspectCount++;
                }
            }
        } else {
            logger.error(`Wrong behaviour. Device ${Device._id} without ${JSON.stringify({Property: !!Property, Building: !!Building , Floor: !!Floor})}, ids: ${JSON.stringify({ PropertyID : Device.PropertyID, BuildingID: Device.BuildingID, FloorID: Device.FloorID})}`);
        }

    }
};

const getPropertiesEntitiesFlat = ()=> {
    return Promise
        .props({
            Properties: getProperties(),
            Buildings: getBuildings(),
            Floors: getFloors(),
            Devices: getDevices(),
            Records: getRecords()
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
const recalculateProcessedCache = ()=> {
    // This is too simple, need to use something like redis
    // console.log('recalculate cache');
    // cache.processed = null;
    // getPropertiesEntitiesFlat().then(response => {
    //     cache.processed = response;
    // });
};

db.once('open', (e)=> {
    try {
        recalculateProcessedCache();
    } catch (err) {
        console.log(err);
    }
});

exports.processed = {
    handler: (request, reply) => {
        const {hash} = request.query;
        logger.info(`properties.processed ${hash} request`);
        let {layer} = request.query;
        if (layer && typeof layer === 'string') {
            layer = [layer];
        }
        console.time(`properties.processed ${hash} request`);
        isAuthorized(request, reply)
            .then(() => {
                return getPropertiesEntitiesFlat()
                    .then((response) => {
                        cache.processed = response;

                        let pickedResponse;
                        if (layer) {
                            pickedResponse = _.pick(response, layer);
                        } else {
                            pickedResponse = response;
                        }

                        if (pickedResponse.Devices) {
                            let {DeviceID} = request.query || request.params;
                            if (DeviceID) {
                                pickedResponse.Devices = pickedResponse.Devices.filter(device => device && device._id.toString() === DeviceID);
                            }
                        }

                        return reply(pickedResponse);
                    })
                    .catch(err => reply(Boom.badImplementation(err)));
            })
            .finally(() => {
                console.timeEnd(`properties.processed ${hash} request`);
            });
    }
};
