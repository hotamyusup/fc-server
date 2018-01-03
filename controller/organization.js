/**
 * Created by Zeus on 09/03/16.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');
var Organization = require('../schema/organization').Organization;
var User = require('../schema/user').User;

exports.all = {
    handler: function (request, reply) {
        var hash = request.query.hash;
        if(!hash){return reply(Boom.unauthorized());}
        User.findOne({ '_id' : hash }, function (err, user) {
            if (!user) {return reply(Boom.unauthorized());}
        });
        Organization.find({}, function (err, organizations) {
            if (!err) {
                return reply(organizations);
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
        Organization.findOne({ '_id' : request.params.OrganizationID }, function (err, organization) {
            if (!err) {
                return reply(organization);
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
        var organization = new Organization(request.payload);
        organization.save(function (err, organization) {
            if (!err) {
                return reply(organization).created('/organization/' + organization._id); // HTTP 201
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
        Organization.findOne({ '_id' : request.params.OrganizationID }, function (err, organization) {
            if (!err) {
                organization.Title =  request.payload.Title;
                organization.save(function (err, organization) {
                    if (!err) {
                        return reply(organization); // HTTP 201
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
