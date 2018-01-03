/**
 * Created by Zeus on 09/01/17.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');
var Property = require('../schema/property').Property;
var Building = require('../schema/property').Building;
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
                var _Building = property.Buildings.id(request.payload._id);
                if(!_Building){
                    var building = new Building(request.payload);
                    property.Buildings.push(building);
                    property.save();
                    return reply(property);
                }else{
                    _Building.Title = request.payload.Title;
                    _Building.Map = request.payload.Map;
                    _Building.XPos = request.payload.XPos;
                    _Building.YPos = request.payload.YPos;
                    _Building.Picture = request.payload.Picture;
                    _Building.Status = request.payload.Status;
                    _Building.updated_at = request.payload.updated_at;

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
                var building = new Building(request.payload);
                property.Buildings.push(building);
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
                var _Building = property.Buildings.id(request.payload.BuildingID);
                _Building.Title = request.payload.Title;
                _Building.Map = request.payload.Map;
                _Building.XPos = request.payload.XPos;
                _Building.YPos = request.payload.YPos;
                _Building.Picture = request.payload.Picture;
                _Building.Status = request.payload.Status;
                _Building.updated_at = request.payload.updated_at;

                property.save();
                return reply(property);
            }

            return reply(Boom.badImplementation(err)); // 500 error
        });
    }
};