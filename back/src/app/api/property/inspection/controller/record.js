/**
 * Created by Zeus on 09/01/17.
 */

var Boom = require('boom');
var Property = require('../schema/property').Property;
var Inspection = require('../schema/property').Inspection;
var User = require('../schema/user').User;
const logger = require('../logger');

exports.create = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne({ _id: hash }, function(err, user) {
      if (!user) {
        return reply(Boom.unauthorized());
      }
    });
    console.log(request.payload.PropertyID);
    Property.findOne({ _id: request.payload.PropertyID }, function(
      err,
      property
    ) {
      if (!err) {
        var _Device = property.Buildings.id(request.payload.BuildingID)
          .Floors.id(request.payload.FloorID)
          .Devices.id(request.payload.DeviceID);
        var inspectipon = new Inspection(request.payload);
        _Device.Records.push(inspectipon);
        property.save();
        return reply(property);
      }

      return reply(Boom.badImplementation(err)); // 500 error
    });
  },
};

exports.batch = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      logger.info('record.batch unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`record.batch ${hash} request`);
    User.findOne({ _id: hash }, function(err, user) {
      if (!user) {
        logger.info(`record.batch ${hash} unauthorized no user`);
        return reply(Boom.unauthorized());
      }
    });
    Property.findOne({ _id: request.payload.PropertyID }, function(
      err,
      property
    ) {
      if (!err) {
        var _Device = property.Buildings.id(request.payload.BuildingID)
          .Floors.id(request.payload.FloorID)
          .Devices.id(request.payload.DeviceID);
        var inspectipon = new Inspection(request.payload);
        _Device.Records.push(inspectipon);
        property.save();
        return reply(property);
      }

      return reply(Boom.badImplementation(err)); // 500 error
    });
  },
};
