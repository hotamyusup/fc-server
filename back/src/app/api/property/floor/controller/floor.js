/**
 * Created by Zeus on 09/01/17.
 */

const Boom = require('boom');
const Property = require('../schema/property').Property;
const Floor = require('../schema/property').Floor;
const User = require('../schema/user').User;
const async = require('async');
const logger = require('../logger');
const _ = require('lodash');
const Promise = require('bluebird');
const {isAuthorized} = require('../user-access');


exports.upsert = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if (!hash) {
            return reply(Boom.unauthorized());
        }
        User.findOne(
            {
                _id: hash,
            },
            function (err, user) {
                if (!user) {
                    return reply(Boom.unauthorized());
                }
            }
        );

        Property.findOne(
            {
                _id: request.payload.PropertyID,
            },
            function (err, property) {
                if (!err) {
                    var _Floor = property.Buildings.id(
                        request.payload.BuildingID
                    ).Floors.id(request.payload._id);
                    if (!_Floor) {
                        var _Building = property.Buildings.id(request.payload.BuildingID);
                        var floor = new Floor(request.payload);
                        _Building.Floors.push(floor);
                        property.save(function (err, property) {
                            if (!err) {
                                return reply(property); // HTTP 201
                            }
                            if (11000 === err.code || 11001 === err.code) {
                                return reply(
                                    Boom.forbidden('please provide another id, it already exist')
                                );
                            }
                            return reply(Boom.forbidden(err)); // HTTP 403
                        });
                    } else {
                        _Floor.Title = request.payload.Title;
                        _Floor.Map = request.payload.Map;
                        _Floor.XPos = request.payload.XPos;
                        _Floor.YPos = request.payload.YPos;
                        _Floor.Status = request.payload.Status;
                        _Floor.updated_at = request.payload.updated_at;

                        property.save(function (err, property) {
                            if (!err) {
                                return reply(property); // HTTP 201
                            }
                            if (11000 === err.code || 11001 === err.code) {
                                return reply(
                                    Boom.forbidden('please provide another id, it already exist')
                                );
                            }
                            return reply(Boom.forbidden(err)); // HTTP 403
                        });
                    }
                }
            }
        );
    },
};

exports.batch = {
    handler: function (request, reply) {
        var hash = request.query.hash;

        isAuthorized(request, reply)
            .then(() => {
                logger.info(`floor.batch ${hash} started`);
                var floors = request.payload.floors;
                const getPropertiesMap = (ids) => Property.find({_id: {$in: ids}}).exec().then(properties => _.keyBy(properties, '_id'));

                getPropertiesMap(_.uniq(_.map(floors, floor => floor.PropertyID)))
                    .then(id2propertiesMap => Promise.map(floors, data => {
                            let property = id2propertiesMap[data.PropertyID];
                            var _Building = property.Buildings.id(data.BuildingID);
                            var _Floor = _Building.Floors.id(data._id);
                            if (!_Floor) {
                                var floor = new Floor(data);
                                _Building.Floors.push(floor);
                            } else {
                                _Floor.Title = data.Title;
                                _Floor.Map = data.Map;
                                _Floor.XPos = data.XPos;
                                _Floor.YPos = data.YPos;
                                _Floor.Status = data.Status;
                                _Floor.updated_at = data.updated_at;
                            }
                        })
                        .then(() => id2propertiesMap))
                    .then((id2propertiesMap) => Promise.map(Object.keys(id2propertiesMap), _id => id2propertiesMap[_id].save()))
                    .then(() => {
                        logger.info(`floor.batch ${hash} finish`);
                        return reply({});
                    })
                    .catch(error => {
                        logger.error(`floor.batch ${hash} error:\n` + JSON.stringify(error));
                        return reply({error: error})
                    });
            });
    },
};

exports.create = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if (!hash) {
            return reply(Boom.unauthorized());
        }
        User.findOne(
            {
                _id: hash,
            },
            function (err, user) {
                if (!user) {
                    return reply(Boom.unauthorized());
                }
            }
        );

        Property.findOne(
            {
                _id: request.payload.PropertyID,
            },
            function (err, property) {
                if (!err) {
                    var _Building = property.Buildings.id(request.payload.BuildingID);
                    var floor = new Floor(request.payload);
                    _Building.Floors.push(floor);
                    property.save();
                    return reply(property);
                }

                return reply(Boom.badImplementation(err)); // 500 error
            }
        );
    },
};

exports.duplicate = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if (!hash) {
            return reply(Boom.unauthorized());
        }
        User.findOne(
            {
                _id: hash,
            },
            function (err, user) {
                if (!user) {
                    return reply(Boom.unauthorized());
                }
            }
        );

        var newFloor = JSON.parse(request.payload.content);
        Property.findOne(
            {
                _id: newFloor.PropertyID,
            },
            function (err, property) {
                if (!err) {
                    var _Building = property.Buildings.id(newFloor.BuildingID);
                    var floor = new Floor(newFloor);
                    _Building.Floors.push(floor);
                    property.save();
                    return reply(property);
                }

                return reply(Boom.badImplementation(err)); // 500 error
            }
        );
    },
};

exports.update = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if (!hash) {
            return reply(Boom.unauthorized());
        }
        User.findOne(
            {
                _id: hash,
            },
            function (err, user) {
                if (!user) {
                    return reply(Boom.unauthorized());
                }
            }
        );

        Property.findOne(
            {
                _id: request.payload.PropertyID,
            },
            function (err, property) {
                if (!err) {
                    var _Floor = property.Buildings.id(
                        request.payload.BuildingID
                    ).Floors.id(request.payload.FloorID);
                    _Floor.Title = request.payload.Title;
                    _Floor.Map = request.payload.Map;
                    _Floor.XPos = request.payload.XPos;
                    _Floor.YPos = request.payload.YPos;
                    _Floor.Status = request.payload.Status;
                    _Floor.updated_at = request.payload.updated_at;
                    property.save();
                    return reply(property);
                }

                return reply(Boom.badImplementation(err)); // 500 error
            }
        );
    },
};
