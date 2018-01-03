/**
 * Created by Zeus on 09/03/16.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');
var geocoder = require('node-geocoder')("google", "http");
var Property = require('../schema/property').Property;
var Floor = require('../schema/property').Floor;
var User = require('../schema/user').User;

exports.all = {
    handler: function (request, reply) {
        Property.find({}, function (err, properties) {
            if (!err) {
                return reply(properties);
            }
            return reply(Boom.badImplementation(err)); // 500 error
        }).where('Status').gt(-1);
    }
};

exports.get = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if(!hash){return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });

        /*
        var Building = {};
        Property.findOne({ 'Buildings._id' : request.params.PropertyID }, {'Buildings.$': 1},function (err, property) {
            if (!err) {
                Building = property.Buildings[0];
            }

            Building.findOne({'Floors.id'})

            return reply(Boom.badImplementation(err)); // 500 error
        });
        */
        Property.findOne({ '_id' : request.params.PropertyID }, function (err, property) {
            if (!err) {return reply(property);}
            return reply(Boom.badImplementation(err)); // 500 error
        });
    }
};


exports.upsert = {
    handler: function(request, reply){
        var hash = request.query.hash;
        if(!hash){
            return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });

        Property.findOne({ '_id' : request.payload._id }, function (err, property) {
            if (!err) {
                if(!property){
                    var property = new Property(request.payload);
                    property.save(function (err, property) {
                        if (!err) {
                            return reply(property).created('/property/' + property._id); // HTTP 201
                        }
                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden("please provide another id, it already exist"));
                        }
                        return reply(Boom.forbidden("Error: "+err)); // HTTP 403
                    });
                }else{
                    property.Title =  request.payload.Title;
                    property.Street=request.payload.Street;
                    property.City=request.payload.City;
                    property.State=request.payload.State;
                    property.ZipCode=request.payload.ZipCode;
                    property.OccupancyUse=request.payload.OccupancyUse;
                    property.ConstructionType=request.payload.ConstructionType;
                    property.Stories=request.payload.Stories;
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


                    geocoder.geocode({address: property.Street+", "+property.City+", "+property.zipcode+", "+property.State, zipcode: property.ZipCode, city: property.City}, function(err, res) {
                        if(!err && res.length > 0){
                            property.Latitude = res[0].latitude;
                            property.Longitude = res[0].longitude;
                        }

                        property.save(function (err, property) {
                            if (!err) {
                                return reply(property); // HTTP 201
                            }
                            if (11000 === err.code || 11001 === err.code) {
                                return reply(Boom.forbidden("please provide another id, it already exist"));
                            }
                            return reply(Boom.forbidden(err)); // HTTP 403
                        });
                    });
                }
            }
            else {
                return reply(Boom.badImplementation(err)); // 500 error
            }
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
        var property = new Property(request.payload);
        property.save(function (err, property) {
            if (!err) {
                return reply(property).created('/property/' + property._id); // HTTP 201
            }
            if (11000 === err.code || 11001 === err.code) {
                return reply(Boom.forbidden("please provide another id, it already exist"));
            }
            return reply(Boom.forbidden("Error: "+err)); // HTTP 403
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
        Property.findOne({ '_id' : request.params.PropertyID }, function (err, property) {
            if (!err) {
                property.Title =  request.payload.Title;
                property.Street=request.payload.Street;
                property.City=request.payload.City;
                property.State=request.payload.State;
                property.ZipCode=request.payload.ZipCode;
                property.OccupancyUse=request.payload.OccupancyUse;
                property.ConstructionType=request.payload.ConstructionType;
                property.Stories=request.payload.Stories;
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


                geocoder.geocode({address: property.Street+", "+property.City+", "+property.zipcode+", "+property.State, zipcode: property.ZipCode, city: property.City}, function(err, res) {
                    if(!err && res.length > 0){
                        property.Latitude = res[0].latitude;
                        property.Longitude = res[0].longitude;
                    }

                    property.save(function (err, property) {
                        if (!err) {
                            return reply(property); // HTTP 201
                        }
                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden("please provide another id, it already exist"));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });
                });
            }
            else {
                return reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};