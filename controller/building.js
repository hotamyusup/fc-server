/**
 * Created by Zeus on 09/01/17.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');
var Property = require('../schema/property').Property;
var Building = require('../schema/property').Building;
var User = require('../schema/user').User;
var async = require('async');

exports.upsert = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne({
      '_id': hash
    }, function(err, user) {
      if (!user) {
        return reply(Boom.unauthorized());
      }
    });
    Property.findOne({
      '_id': request.payload.PropertyID
    }, function(err, property) {
      if (!err) {
        var _Building = property.Buildings.id(request.payload._id);
        if (!_Building) {
          var building = new Building(request.payload);
          property.Buildings.push(building);
          property.save(function(err, property) {
            if (!err) {
              return reply(property); // HTTP 201
            }
            if (11000 === err.code || 11001 === err.code) {
              return reply(Boom.forbidden("please provide another id, it already exist"));
            }
            return reply(Boom.forbidden(err)); // HTTP 403
          });
        } else {
          _Building.Title = request.payload.Title;
          _Building.Map = request.payload.Map;
          _Building.XPos = request.payload.XPos;
          _Building.YPos = request.payload.YPos;
          _Building.Picture = request.payload.Picture;
          _Building.Status = request.payload.Status;
          _Building.updated_at = request.payload.updated_at;

          property.save(function(err, property) {
            if (!err) {
              return reply(property); // HTTP 201
            }
            if (11000 === err.code || 11001 === err.code) {
              return reply(Boom.forbidden("please provide another id, it already exist"));
            }
            return reply(Boom.forbidden(err)); // HTTP 403
          });
        }
      }
    });
  }
};

exports.batch = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne({
      '_id': hash
    }, function(err, user) {
      if (!user) {
        return reply(Boom.unauthorized());
      }
    });

    var buildings = request.payload.buildings;
    async.eachSeries(buildings, function(data, callback) {
      Property.findOne({
        '_id': data.PropertyID
      }, function(err, property) {
        if (!err) {
          var _Building = property.Buildings.id(data._id);
          if (!_Building) {
            var building = new Building(data);
            property.Buildings.push(building);
            property.save();
          } else {
            _Building.Title = data.Title;
            _Building.Map = data.Map;
            _Building.XPos = data.XPos;
            _Building.YPos = data.YPos;
            _Building.Picture = data.Picture;
            _Building.Status = data.Status;
            _Building.updated_at = data.updated_at;

            property.save();
          }
        }
        callback(null);
      });
    }, function(err) {
      return reply({});
    });
  }
};

exports.create = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne({
      '_id': hash
    }, function(err, user) {
      if (!user) {
        return reply(Boom.unauthorized());
      }
    });

    Property.findOne({
      '_id': request.payload.PropertyID
    }, function(err, property) {
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
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne({
      '_id': hash
    }, function(err, user) {
      if (!user) {
        return reply(Boom.unauthorized());
      }
    });

    Property.findOne({
      '_id': request.payload.PropertyID
    }, function(err, property) {
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
