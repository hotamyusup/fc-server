/**
 * Created by Zeus on 09/01/17.
 */

const Boom = require('boom');
const Property = require('../schema/property').Property;
const Floor = require('../schema/property').Floor;
const User = require('../schema/user').User;
const async = require('async');

exports.upsert = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          return reply(Boom.unauthorized());
        }
      }
    );

    Property.findOne(
      {
        _id: request.payload.PropertyID,
      },
      function(err, property) {
        if (!err) {
          var _Floor = property.Buildings.id(
            request.payload.BuildingID
          ).Floors.id(request.payload._id);
          if (!_Floor) {
            var _Building = property.Buildings.id(request.payload.BuildingID);
            var floor = new Floor(request.payload);
            _Building.Floors.push(floor);
            property.save(function(err, property) {
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

            property.save(function(err, property) {
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
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      logger.info('floor.batch unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`floor.batch ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          logger.info(`floor.batch ${hash} unauthorized no user`);
          return reply(Boom.unauthorized());
        }
      }
    );

    var floors = request.payload.floors;
    async.eachSeries(
      floors,
      function(data, callback) {
        Property.findOne(
          {
            _id: data.PropertyID,
          },
          function(err, property) {
            if (!err) {
              var _Floor = property.Buildings.id(data.BuildingID).Floors.id(
                data._id
              );
              if (!_Floor) {
                var _Building = property.Buildings.id(data.BuildingID);
                var floor = new Floor(data);
                _Building.Floors.push(floor);
                property.save();
              } else {
                _Floor.Title = data.Title;
                _Floor.Map = data.Map;
                _Floor.XPos = data.XPos;
                _Floor.YPos = data.YPos;
                _Floor.Status = data.Status;
                _Floor.updated_at = data.updated_at;

                property.save();
              }
            } else {
              logger.info(`floor.batch ${hash} error ${err}`);
            }
            callback(null);
          }
        );
      },
      function(err) {
        logger.info(`floor.batch ${hash} finish`);
        return reply({});
      }
    );
  },
};

exports.create = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          return reply(Boom.unauthorized());
        }
      }
    );

    Property.findOne(
      {
        _id: request.payload.PropertyID,
      },
      function(err, property) {
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
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
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
      function(err, property) {
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
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      return reply(Boom.unauthorized());
    }
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          return reply(Boom.unauthorized());
        }
      }
    );

    Property.findOne(
      {
        _id: request.payload.PropertyID,
      },
      function(err, property) {
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
