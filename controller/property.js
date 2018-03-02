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

const checkAccess = (_id) => User
    .findOne({_id})
    .exec()
    .then(user => {
        if (!user) {
            throw new Error("unauthorized")
        }
        return user;
    });

const callIfAuthorized = (request, reply, action) => {
    const {hash} = request.query;
    return checkAccess(hash)
        .then(action)
        .catch(e => {
            logger.error(`properties.get ${hash} unauthorized no user`);
            reply(Boom.unauthorized());
        });
};

exports.all = {
    handler: (request, reply) => {
        const {hash} = request.query;
        logger.info(`properties.all ${hash} request`);
        Property.find({}, (err, properties) => {
            if (!err) {
                logger.info(`properties.all ${hash} response`);
                return reply(properties);
            }
            logger.info(`properties.all ${hash} ${err}`);
            return reply(Boom.badImplementation(err)); // 500 error
        })
            .where('Status')
            .gt(-1);
    },
};

exports.get = {
    handler: (request, reply) => {
        const {hash} = request.query;
        if (!hash) {
            logger.info('properties.get unauthorized no hash');
            return reply(Boom.unauthorized());
        }
        logger.info(`properties.get ${hash} request`);
        User.findOne(
            {
                _id: hash,
            },
            (err, user) => {
                if (!user) {
                    logger.info(`properties.get ${hash} unauthorized no user`);
                    return reply(Boom.unauthorized());
                }
            }
        );
        Property.findOne(
            {
                _id: request.params.PropertyID,
            },
            (err, property) => {
                if (!err) {
                    logger.info(`properties.get ${hash} response`);
                    return reply(property);
                }
                logger.info(`properties.get ${hash} ${err}`);
                return reply(Boom.badImplementation(err)); // 500 error
            }
        );
    },
};

exports.upsert = {
    handler: (request, reply) => {
        const {hash} = request.query;
        if (!hash) {
            logger.info('properties.upsert unauthorized no hash');
            return reply(Boom.unauthorized());
        }
        logger.info(`properties.upsert ${hash} request`);
        User.findOne(
            {
                _id: hash,
            },
            (err, user) => {
                if (!user) {
                    logger.info(`properties.upsert ${hash} unauthorized no user`);
                    return reply(Boom.unauthorized());
                }
            }
        );

        Property.findOne(
            {
                _id: request.payload._id,
            },
            (err, property) => {
                if (!err) {
                    if (!property) {
                        var property = new Property(request.payload);
                        property.save(function (err, property) {
                            if (!err) {
                                logger.info(`properties.upsert ${hash} saved new`);
                                return reply(property).created('/property/' + property._id); // HTTP 201
                            }
                            logger.info(`properties.upsert ${hash} ${err}`);
                            if (11000 === err.code || 11001 === err.code) {
                                return reply(
                                    Boom.forbidden('please provide another id, it already exist')
                                );
                            }
                            return reply(Boom.forbidden('Error: ' + err)); // HTTP 403
                        });
                    } else {
                        property.Title = request.payload.Title;
                        property.Street = request.payload.Street;
                        property.City = request.payload.City;
                        property.State = request.payload.State;
                        property.ZipCode = request.payload.ZipCode;
                        property.OccupancyUse = request.payload.OccupancyUse;
                        property.ConstructionType = request.payload.ConstructionType;
                        property.Stories = request.payload.Stories;
                        property.YearConstructed = request.payload.YearConstructed;
                        property.Organization = request.payload.Organization;
                        property.PropertyManager = request.payload.PropertyManager;
                        property.QRCode = request.payload.QRCode;
                        property.Map = request.payload.Map;
                        property.Picture = request.payload.Picture;
                        property.Latitude = request.payload.Latitude;
                        property.Longitude = request.payload.Longitude;
                        //property.Buildings = request.payload.Buildings;
                        property.Contacts = request.payload.Contacts;
                        property.Status = request.payload.Status;
                        property.Adddate = request.payload.AddDate;
                        property.created_at = request.payload.created_at;
                        property.updated_at = request.payload.updated_at;

                        geocoder.geocode(
                            {
                address:
                  property.Street +
                                ', ' +
                                property.City +
                                ', ' +
                                property.zipcode +
                                ', ' +
                                property.State,
                                zipcode: property.ZipCode,
                                city: property.City,
                            },
                            function (err, res) {
                                if (!err && res.length > 0) {
                                    property.Latitude = res[0].latitude;
                                    property.Longitude = res[0].longitude;
                                }

                                property.save(function (err, property) {
                                    if (!err) {
                                        logger.info(`properties.upsert ${hash} updated`);
                                        return reply(property); // HTTP 201
                                    }
                                    logger.info(`properties.upsert ${hash} update ${err}`);
                                    if (11000 === err.code || 11001 === err.code) {
                                        return reply(
                                            Boom.forbidden(
                                                'please provide another id, it already exist'
                                            )
                                        );
                                    }
                                    return reply(Boom.forbidden(err)); // HTTP 403
                                });
                            }
                        );
                    }
                } else {
                    logger.info(`properties.upsert ${hash} ${err}`);
                    return reply(Boom.badImplementation(err)); // 500 error
                }
            }
        );
    },
};

exports.batch = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if (!hash) {
            logger.info('properties.batch unauthorized no hash');
            return reply(Boom.unauthorized());
        }
        logger.info(`properties.batch ${hash} request`);
        User.findOne(
            {
                _id: hash,
            },
            function (err, user) {
                if (!user) {
                    logger.info(`properties.batch ${hash} unauthorized no user`);
                    return reply(Boom.unauthorized());
                }
            }
        );

        var properties = request.payload.properties;
        async.eachSeries(
            properties,
            function (data, callback) {
                Property.findOne(
                    {
                        _id: data._id,
                    },
                    function (err, property) {
                        if (!err) {
                            if (!property) {
                                var property = new Property(data);
                                property.save();
                            } else {
                                property.Title = data.Title;
                                property.Street = data.Street;
                                property.City = data.City;
                                property.State = data.State;
                                property.ZipCode = data.ZipCode;
                                property.OccupancyUse = data.OccupancyUse;
                                property.ConstructionType = data.ConstructionType;
                                property.Stories = data.Stories;
                                property.YearConstructed = data.YearConstructed;
                                property.Organization = data.Organization;
                                property.PropertyManager = data.PropertyManager;
                                property.QRCode = data.QRCode;
                                property.Map = data.Map;
                                property.Picture = data.Picture;
                                property.Latitude = data.Latitude;
                                property.Longitude = data.Longitude;
                                //property.Buildings = data.Buildings;
                                property.Contacts = data.Contacts;
                                property.Status = data.Status;
                                property.Adddate = data.AddDate;
                                property.created_at = data.created_at;
                                property.updated_at = data.updated_at;

                                geocoder.geocode(
                                    {
                    address:
                      property.Street +
                                        ', ' +
                                        property.City +
                                        ', ' +
                                        property.zipcode +
                                        ', ' +
                                        property.State,
                                        zipcode: property.ZipCode,
                                        city: property.City,
                                    },
                                    function (err, res) {
                                        if (!err && res.length > 0) {
                                            property.Latitude = res[0].latitude;
                                            property.Longitude = res[0].longitude;
                                        }

                                        property.save();
                                    }
                                );
                            }
                        } else {
                            logger.info(`properties.batch ${hash} error ${err}`);
                        }
                        callback(null);
                    }
                );
            },
            function (err) {
                logger.info(`properties.batch ${hash} finish`);
                return reply({});
            }
        );
    },
};

exports.create = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if (!hash) {
            logger.info('properties.create unauthorized no hash');
            return reply(Boom.unauthorized());
        }
        logger.info(`properties.create ${hash} request`);
        User.findOne(
            {
                _id: hash,
            },
            function (err, user) {
                if (!user) {
                    logger.info(`properties.create ${hash} unauthorized no user`);
                    return reply(Boom.unauthorized());
                }
            }
        );
        var property = new Property(request.payload);
        property.save(function (err, property) {
            if (!err) {
                logger.info(`properties.create ${hash} saved new`);
                return reply(property).created('/property/' + property._id); // HTTP 201
            }
            logger.info(`properties.create ${hash} ${err}`);
            if (11000 === err.code || 11001 === err.code) {
                return reply(
                    Boom.forbidden('please provide another id, it already exist')
                );
            }
            return reply(Boom.forbidden('Error: ' + err)); // HTTP 403
        });
    },
};

exports.update = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if (!hash) {
            logger.info('properties.update unauthorized no hash');
            return reply(Boom.unauthorized());
        }
        logger.info(`properties.update ${hash} request`);
        User.findOne(
            {
                _id: hash,
            },
            function (err, user) {
                if (!user) {
                    logger.info(`properties.update ${hash} unauthorized no user`);
                    return reply(Boom.unauthorized());
                }
            }
        );
        Property.findOne(
            {
                _id: request.params.PropertyID,
            },
            function (err, property) {
                if (!err) {
                    property.Title = request.payload.Title;
                    property.Street = request.payload.Street;
                    property.City = request.payload.City;
                    property.State = request.payload.State;
                    property.ZipCode = request.payload.ZipCode;
                    property.OccupancyUse = request.payload.OccupancyUse;
                    property.ConstructionType = request.payload.ConstructionType;
                    property.Stories = request.payload.Stories;
                    property.YearConstructed = request.payload.YearConstructed;
                    property.Organization = request.payload.Organization;
                    property.PropertyManager = request.payload.PropertyManager;
                    property.QRCode = request.payload.QRCode;
                    property.Map = request.payload.Map;
                    property.Picture = request.payload.Picture;
                    property.Latitude = request.payload.Latitude;
                    property.Longitude = request.payload.Longitude;
                    //property.Buildings = request.payload.Buildings;
                    property.Contacts = request.payload.Contacts;
                    property.Status = request.payload.Status;
                    property.Adddate = request.payload.AddDate;
                    property.created_at = request.payload.created_at;
                    property.updated_at = request.payload.updated_at;

                    geocoder.geocode(
                        {
              address:
                property.Street +
                            ', ' +
                            property.City +
                            ', ' +
                            property.zipcode +
                            ', ' +
                            property.State,
                            zipcode: property.ZipCode,
                            city: property.City,
                        },
                        function (err, res) {
                            if (!err && res.length > 0) {
                                property.Latitude = res[0].latitude;
                                property.Longitude = res[0].longitude;
                            }

                            property.save(function (err, property) {
                                if (!err) {
                                    logger.info(`properties.update ${hash} saved`);
                                    return reply(property); // HTTP 201
                                }
                                logger.info(`properties.update ${hash} ${err}`);
                                if (11000 === err.code || 11001 === err.code) {
                                    return reply(
                                        Boom.forbidden(
                                            'please provide another id, it already exist'
                                        )
                                    );
                                }
                                return reply(Boom.forbidden(err)); // HTTP 403
                            });
                        }
                    );
                } else {
                    logger.info(`properties.update ${hash} ${err}`);
                    return reply(Boom.badImplementation(err)); // 500 error
                }
            }
        );
    },
};



const getProperties = function () {
    console.time('getProperties');
    return Property
        .aggregate([{$addFields: {"Buildings": "$Buildings._id"}} , {$match: {Status: {$gt: -1}}}])
        .exec()
        .then(properties => {
            console.timeEnd('getProperties');
            console.log('properties.length = ' + properties.length)
            return properties;
        })
};
const getBuildings = function () {
    console.time('getBuildings');
    return Property
        .aggregate([
            {$unwind: "$Buildings"},
            {$match: {"Buildings.Status": {$gt:-1}}},
            {
                $addFields: {
                    "Buildings.PropertyID": "$_id",
                    "Buildings.Floors": "$Buildings.Floors._id"
                }
            },
            {$replaceRoot: {newRoot: "$Buildings"}}
        ])
        .exec()
        .then(buildings => {
            console.timeEnd('getBuildings');
            console.log('buildings.length = ' + buildings.length)
            return buildings;
        })
};
const getFloors = function () {
    console.time('getFloors');
    return Property
        .aggregate([
            {$unwind: "$Buildings"},
            {$match: {"Buildings.Status": {$gt:-1}}},
            {$unwind: "$Buildings.Floors"},
            {$match: {"Buildings.Floors.Status": {$gt:-1}}},
            {
                $addFields: {
                    "Buildings.Floors.PropertyID": "$_id",
                    "Buildings.Floors.BuildingID": "$Buildings._id",
                    "Buildings.Floors.Devices": "$Buildings.Floors.Devices._id"
                }
            },
            {$replaceRoot: {newRoot: "$Buildings.Floors"}}
        ])
        .exec()
        .then(floors => {
            console.timeEnd('getFloors');
            console.log('floors.length = ' + floors.length)
            return floors;
        })
};
const getDevices = function () {
    console.time('getDevices');
    return Property
        .aggregate([
            {$unwind: "$Buildings"},
            {$match: {"Buildings.Status": {$gt:-1}}},
            {$unwind: "$Buildings.Floors"},
            {$match: {"Buildings.Floors.Status": {$gt:-1}}},
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
        .exec()
        .then(devices => {
            console.timeEnd('getDevices');
            console.log('devices.length = ' + devices.length)
            return devices;
        })
};
const getRecords = function () {
    console.time('getRecords');
    return Property
        .aggregate([
            {$unwind: "$Buildings"},
            {$match: {"Buildings.Status": {$gt:-1}}},
            {$unwind: "$Buildings.Floors"},
            {$match: {"Buildings.Floors.Status": {$gt:-1}}},
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
        .exec()
        .then(records => {
            console.timeEnd('getRecords');
            console.log('records.length = ' + records.length)
            return records;
        })
};
const calculateRepairAndInspectState = (Properties, Buildings, Floors, Devices, Records)=> {
    const Quarter = moment().subtract(3, 'months').format('YYYY-MM-DD');
    const Semi    = moment().subtract(6, 'months').format('YYYY-MM-DD');
    const Annual  = moment().subtract(1, 'years').format('YYYY-MM-DD');
    const Last    = moment().subtract(5, 'years').format('YYYY-MM-DD');

    const convertToIdMap = (id2object, object)=> (id2object[object._id] = object) && id2object;

    const PropertyById = Properties.reduce(convertToIdMap, {});
    const BuildingById = Buildings.reduce(convertToIdMap, {});
    const FloorById    = Floors.reduce(convertToIdMap, {});
    const RecordById   = Records.reduce(convertToIdMap, {});

    for (let l = 0; l < Devices.length; l++) {
        const Device = Devices[l];
        const InstallDate = ('' + Device.InstallationDate).substr(0, 'YYYY-MM-DD'.length);
        let LastFrequency;

        const Property  = PropertyById[Device.PropertyID];
        const Building  = BuildingById[Device.BuildingID];
        const Floor     = FloorById[Device.FloorID];

        const deviceRecords = _.sortBy(Device.Records.map(recordId => RecordById[recordId]), 'InspectionDate').reverse();

        if (deviceRecords.length > 0) {
            const LastRecord = deviceRecords[0];
            if (LastRecord.DeviceStatus == 1) {
                Property.HasRepair  = 1;
                Building.HasRepair  = 1;
                Floor.HasRepair     = 1;
                Device.HasRepair    = 1;
                Property.RepairCount++;
            }
            LastFrequency = LastRecord.Frequency;
        } else {
            LastFrequency = -1;
        }

        if (LastFrequency != 1) {
            if ((InstallDate < Last && LastFrequency < 3) || (InstallDate < Annual && LastFrequency < 2) || (InstallDate < Semi && LastFrequency < 1) || (InstallDate < Quarter && LastFrequency < 0)) {
                Property.HasInspect = 1;
                Building.HasInspect = 1;
                Floor.HasInspect    = 1;
                Device.HasInspect   = 1;
                Property.InspectCount++;
            }
        }

    }
};
exports.processed = {
    handler: (request, reply) => {
        const {hash} = request.query;
        logger.info(`properties.processed ${hash} request`);

        console.time('processed.handler.get');
        callIfAuthorized(request, reply, () => {
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
                    return reply(response);
                })
                .catch(err => reply(Boom.badImplementation(err)));
        }).finally(() => {
            console.timeEnd('processed.handler.get');
        });
    }
};