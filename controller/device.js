/**
 * Created by Zeus on 09/01/17.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');
var Property = require('../schema/property').Property;
var Device = require('../schema/property').Device;
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
                var _Device = property.Buildings.id(request.payload.BuildingID).Floors.id(request.payload.FloorID).Devices.id(request.payload._id);
                if(!_Device){
                    var _Floor = property.Buildings.id(request.payload.BuildingID).Floors.id(request.payload.FloorID);
                    var device = new Device(request.payload);
                    _Floor.Devices.push(device);
                    property.save();
                    return reply(property);
                }else{
                    _Device.EquipmentType = request.payload.EquipmentType;
                    _Device.DeviceType = request.payload.DeviceType;
                    _Device.ModelNumber = request.payload.ModelNumber;
                    _Device.SerialNumber = request.payload.SerialNumber;
                    _Device.InstallationDate = request.payload.InstallationDate;
                    _Device.DeviceLocation = request.payload.DeviceLocation;
                    _Device.Notes = request.payload.Notes;
                    _Device.QRCode = request.payload.QRCode;
                    _Device.Picture = request.payload.Picture;
                    _Device.Status = request.payload.Status;
                    _Device.XPos = request.payload.XPos;
                    _Device.YPos = request.payload.YPos;

                    _Device.updated_at = request.payload.updated_at;
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
                var _Floor = property.Buildings.id(request.payload.BuildingID).Floors.id(request.payload.FloorID);
                var device = new Device(request.payload);
                _Floor.Devices.push(device);
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
                var _Device = property.Buildings.id(request.payload.BuildingID).Floors.id(request.payload.FloorID).Devices.id(request.payload._id);
                _Device.EquipmentType = request.payload.EquipmentType;
                _Device.DeviceType = request.payload.DeviceType;
                _Device.ModelNumber = request.payload.ModelNumber;
                _Device.SerialNumber = request.payload.SerialNumber;
                _Device.InstallationDate = request.payload.InstallationDate;
                _Device.DeviceLocation = request.payload.DeviceLocation;
                _Device.Notes = request.payload.Notes;
                _Device.QRCode = request.payload.QRCode;
                _Device.Picture = request.payload.Picture;
                _Device.Status = request.payload.Status;
                _Device.XPos = request.payload.XPos;
                _Device.YPos = request.payload.YPos;

                _Device.updated_at = request.payload.updated_at;
                property.save();
                return reply(property);
            }

            return reply(Boom.badImplementation(err)); // 500 error
        });
    }
};
