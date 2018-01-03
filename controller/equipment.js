/**
 * Created by Zeus on 09/03/16.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');
var Equipment = require('../schema/equipment').Equipment;
var Device = require('../schema/equipment').Device;
var User = require('../schema/user').User;

exports.all = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        
        if(!hash){return reply(Boom.unauthorized());}
        
        User.findOne({ '_id' : hash }, function (err, user) {
        	if (!user) {
        		return reply(Boom.unauthorized());
        	}
        });
        Equipment.find({}, function (err, equipments) {
            if (!err) {
                return reply(equipments);
            }
            return reply(Boom.badImplementation(err)); // 500 error
        });
    }
};

exports.get = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if(!hash){return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });
        Equipment.findOne({ '_id' : request.params.EquipmentID }, function (err, equipment) {
            if (!err) {
                return reply(equipment);
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
        var equipment = new Equipment(request.payload);
        equipment.save(function (err, equipment) {
            if (!err) {
                return reply(equipment).created('/equipment/' + equipment._id); // HTTP 201
            }
            if (11000 === err.code || 11001 === err.code) {
                return reply(Boom.forbidden("please provide another question id, it already exist"));
            }
            return reply(Boom.forbidden(err)); // HTTP 403
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
        Equipment.findOne({ '_id' : request.params.EquipmentID }, function (err, equipment) {
            if (!err) {
                equipment.Title =  request.payload.Title;
                equipment.save(function (err, equipment) {
                    if (!err) {
                        return reply(equipment); // HTTP 201
                    }
                    if (11000 === err.code || 11001 === err.code) {
                        return reply(Boom.forbidden("please provide another id, it already exist"));
                    }
                    return reply(Boom.forbidden(err)); // HTTP 403
                });
            }
            else {  
                return reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};


exports.upsertdevice = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if(!hash){return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });

        Equipment.findOne({ '_id' : request.params.EquipmentID }, function (err, equipment) {
            if (!err) {
                var _Device = equipment.Devices.id(request.params.DeviceID);
                if(!_Device){
                    var device = new Device(request.payload);
                    device.Status = 1;
                    equipment.Devices.push(device);
                    equipment.save();
                    return reply(equipment);
                }else{
                    _Device.Title = request.payload.Title;
                    _Device.Status = request.payload.Status;
                    _Device.Color = request.payload.Color;

                    equipment.save();
                    return reply(equipment);
                }
            }
            else {  
                return reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};

