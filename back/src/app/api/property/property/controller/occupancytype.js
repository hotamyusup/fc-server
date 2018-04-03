/**
 * Created by Zeus on 09/03/16.
 */

var Boom = require('boom');
var OccupancyType = require('../schema/occupancytype').OccupancyType;
var User = require('../schema/user').User;

exports.all = {
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
    OccupancyType.find({}, function(err, occupancytypes) {
      if (!err) {
        return reply(occupancytypes);
      }
      return reply(Boom.badImplementation(err)); // 500 error
    });
  },
};

exports.get = {
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
    OccupancyType.findOne({ _id: request.params.OccupancyTypeID }, function(
      err,
      occupancytype
    ) {
      if (!err) {
        return reply(occupancytype);
      }
      return reply(Boom.badImplementation(err)); // 500 error
    });
  },
};

exports.create = {
  handler: function(request, reply) {
    var occupancytype = new OccupancyType(request.payload);
    occupancytype.save(function(err, occupancytype) {
      if (!err) {
        return reply(occupancytype).created(
          '/occupancytype/' + occupancytype._id
        ); // HTTP 201
      }
      if (11000 === err.code || 11001 === err.code) {
        return reply(
          Boom.forbidden('please provide another id, it already exist')
        );
      }
      return reply(Boom.forbidden(err)); // HTTP 403
    });
  },
};

exports.update = {
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
    OccupancyType.findOne({ _id: request.params.OccupancyTypeID }, function(
      err,
      occupancytype
    ) {
      if (!err) {
        occupancytype.Title = request.payload.Title;
        occupancytype.save(function(err, occupancytype) {
          if (!err) {
            return reply(occupancytype); // HTTP 201
          }
          if (11000 === err.code || 11001 === err.code) {
            return reply(
              Boom.forbidden('please provide another id, it already exist')
            );
          }
          return reply(Boom.forbidden(err)); // HTTP 403
        });
      } else {
        return reply(Boom.badImplementation(err)); // 500 error
      }
    });
  },
};
