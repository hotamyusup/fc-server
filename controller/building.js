/**
 * Created by Zeus on 09/01/17.
 */

const Boom = require('boom');
const { Property, Building } = require('../schema/property');
const { User } = require('../schema/user');
const async = require('async');
const _ = require('lodash');
const logger = require('../logger');
const Promise = require('bluebird');

const {isAuthorized} = require('../user-access');

exports.upsert = {
  handler: (request, reply) => {
    const { hash } = request.query;
    if (!hash) {
      logger.info('building.upsert unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`building.upsert ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      (err, user) => {
        if (!user) {
          logger.info(`building.upsert ${hash} unauthorized no user`);
          return reply(Boom.unauthorized());
        }
      }
    );
    Property.findOne(
      {
        _id: request.payload.PropertyID,
      },
      (err, property) => {
        if (!err) {
          var _Building = property.Buildings.id(request.payload._id);
          if (!_Building) {
            var building = new Building(request.payload);
            property.Buildings.push(building);
            property.save(function(err, property) {
              if (!err) {
                logger.info(`building.upsert ${hash} saved new`);
                return reply(property); // HTTP 201
              }
              logger.info(`building.upsert ${hash} ${err}`);
              if (11000 === err.code || 11001 === err.code) {
                return reply(
                  Boom.forbidden('please provide another id, it already exist')
                );
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
                logger.info(`building.upsert ${hash} updated`);
                return reply(property); // HTTP 201
              }
              logger.info(`building.upsert ${hash} update ${err}`);
              if (11000 === err.code || 11001 === err.code) {
                return reply(
                  Boom.forbidden('please provide another id, it already exist')
                );
              }
              return reply(Boom.forbidden(err)); // HTTP 403
            });
          }
        } else {
          logger.info(`building.upsert ${hash} ${err}`);
          return reply(Boom.badImplementation(err)); // 500 error
        }
      }
    );
  },
};

exports.batch = {
  handler: function (request, reply) {
      var hash = request.query.hash;

      isAuthorized(request, reply)
          .then(() => {
              logger.info(`building.batch ${hash} started`);
              var buildings = request.payload.buildings;
              const getPropertiesMap = (ids) => Property.find({_id: {$in: ids}}).exec().then(properties => _.keyBy(properties, '_id'));

              getPropertiesMap(_.uniq(_.map(buildings, building => building.PropertyID)))
                  .then(id2propertiesMap => {
                      return Promise
                          .map(buildings, data => {
                              var property = id2propertiesMap[data.PropertyID];
                              var _Building = property.Buildings.id(data._id);
                              if (!_Building) {
                                  var building = new Building(data);
                                  property.Buildings.push(building);
                              } else {
                                  _Building.Title = data.Title;
                                  _Building.Map = data.Map;
                                  _Building.XPos = data.XPos;
                                  _Building.YPos = data.YPos;
                                  _Building.Picture = data.Picture;
                                  _Building.Status = data.Status;
                                  _Building.updated_at = data.updated_at;
                              }
                          })
                          .then(() => id2propertiesMap)
                  })
                  .then((id2propertiesMap) => Promise.map(Object.keys(id2propertiesMap), _id => id2propertiesMap[_id].save()))
                  .then(() => {
                      logger.info(`building.batch ${hash} finish`);
                      return reply({});
                  })
                  .catch(error => {
                      logger.error(`building.batch ${hash} error:\n` + error);
                      return reply({error: error})
                  });
          });
  },
};

exports.create = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      logger.info('building.create unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`building.create ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          logger.info(`building.create ${hash} unauthorized no user`);
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
          var building = new Building(request.payload);
          property.Buildings.push(building);
          property.save();
          logger.info(`building.create ${hash} saved new`);
          return reply(property);
        }
        logger.info(`properties.create ${hash} ${err}`);
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
      }
    );
  },
};
