/**
 * Created by Zeus on 09/01/17.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');
var Property = require('../schema/property').Property;
var Floor = require('../schema/property').Floor;
var User = require('../schema/user').User;


exports.upsert = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if(!hash){return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });

        Property.findOne({ '_id' : request.payload.PropertyID }, function (err, property) {
            if (!err) {
                var _Floor = property.Buildings.id(request.payload.BuildingID).Floors.id(request.payload._id);
                if(!_Floor){
                    var _Building = property.Buildings.id(request.payload.BuildingID);
                    var floor = new Floor(request.payload);
                    _Building.Floors.push(floor);
                    property.save();
                    return reply(property);
                }else{
                    _Floor.Title = request.payload.Title;
                    _Floor.Map = request.payload.Map;
                    _Floor.XPos = request.payload.XPos;
                    _Floor.YPos = request.payload.YPos;
                    _Floor.Status = request.payload.Status;
                    _Floor.updated_at = request.payload.updated_at;

                    property.save();
                    return reply(property);
                }
            }

            return reply(Boom.badImplementation(err)); // 500 error
        });
    }
};



exports.create = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if(!hash){return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });

        Property.findOne({ '_id' : request.payload.PropertyID }, function (err, property) {
            if (!err) {
                var _Building = property.Buildings.id(request.payload.BuildingID);
                var floor = new Floor(request.payload);
                _Building.Floors.push(floor);
                property.save();
                return reply(property);
            }

            return reply(Boom.badImplementation(err)); // 500 error
        });
    }
};

exports.update = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if(!hash){return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });

        Property.findOne({ '_id' : request.payload.PropertyID }, function (err, property) {
            if (!err) {
                var _Floor = property.Buildings.id(request.payload.BuildingID).Floors.id(request.payload.FloorID);
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
        });
    }
};