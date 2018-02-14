/**
 * Created by Zeus on 09/03/16.
 */

const Boom = require('boom');
const geocoder = require('node-geocoder')('google', 'http');
const { Property } = require('../schema/property');
const { User } = require('../schema/user');
const async = require('async');
const logger = require('../logger');

exports.all = {
  handler: (request, reply) => {
    const { hash } = request.query;
    logger.info(`properties.all ${hash} request`);
    Property.find({}, (err, properties) => {
      if (!err) {
        logger.info(`properties.all ${hash} response`);
        return reply(properties);
      }
      logger.info(`properties.all ${hash} ${err}`);
      return reply(Boom.badImplementation(err)); // 500 error
    })
      .where('Status')
      .gt(-1);
  },
};

exports.get = {
  handler: (request, reply) => {
    const { hash } = request.query;
    if (!hash) {
      logger.info('properties.get unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`properties.get ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      (err, user) => {
        if (!user) {
          logger.info(`properties.get ${hash} unauthorized no user`);
          return reply(Boom.unauthorized());
        }
      }
    );
    Property.findOne(
      {
        _id: request.params.PropertyID,
      },
      (err, property) => {
        if (!err) {
          logger.info(`properties.get ${hash} response`);
          return reply(property);
        }
        logger.info(`properties.get ${hash} ${err}`);
        return reply(Boom.badImplementation(err)); // 500 error
      }
    );
  },
};

exports.upsert = {
  handler: (request, reply) => {
    const { hash } = request.query;
    if (!hash) {
      logger.info('properties.upsert unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`properties.upsert ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      (err, user) => {
        if (!user) {
          logger.info(`properties.upsert ${hash} unauthorized no user`);
          return reply(Boom.unauthorized());
        }
      }
    );

    Property.findOne(
      {
        _id: request.payload._id,
      },
      (err, property) => {
        if (!err) {
          if (!property) {
            var property = new Property(request.payload);
            property.save(function(err, property) {
              if (!err) {
                logger.info(`properties.upsert ${hash} saved new`);
                return reply(property).created('/property/' + property._id); // HTTP 201
              }
              logger.info(`properties.upsert ${hash} ${err}`);
              if (11000 === err.code || 11001 === err.code) {
                return reply(
                  Boom.forbidden('please provide another id, it already exist')
                );
              }
              return reply(Boom.forbidden('Error: ' + err)); // HTTP 403
            });
          } else {
            property.Title = request.payload.Title;
            property.Street = request.payload.Street;
            property.City = request.payload.City;
            property.State = request.payload.State;
            property.ZipCode = request.payload.ZipCode;
            property.OccupancyUse = request.payload.OccupancyUse;
            property.ConstructionType = request.payload.ConstructionType;
            property.Stories = request.payload.Stories;
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

            geocoder.geocode(
              {
                address:
                  property.Street +
                  ', ' +
                  property.City +
                  ', ' +
                  property.zipcode +
                  ', ' +
                  property.State,
                zipcode: property.ZipCode,
                city: property.City,
              },
              function(err, res) {
                if (!err && res.length > 0) {
                  property.Latitude = res[0].latitude;
                  property.Longitude = res[0].longitude;
                }

                property.save(function(err, property) {
                  if (!err) {
                    logger.info(`properties.upsert ${hash} updated`);
                    return reply(property); // HTTP 201
                  }
                  logger.info(`properties.upsert ${hash} update ${err}`);
                  if (11000 === err.code || 11001 === err.code) {
                    return reply(
                      Boom.forbidden(
                        'please provide another id, it already exist'
                      )
                    );
                  }
                  return reply(Boom.forbidden(err)); // HTTP 403
                });
              }
            );
          }
        } else {
          logger.info(`properties.upsert ${hash} ${err}`);
          return reply(Boom.badImplementation(err)); // 500 error
        }
      }
    );
  },
};

exports.batch = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      logger.info('properties.batch unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`properties.batch ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          logger.info(`properties.batch ${hash} unauthorized no user`);
          return reply(Boom.unauthorized());
        }
      }
    );

    var properties = request.payload.properties;
    async.eachSeries(
      properties,
      function(data, callback) {
        Property.findOne(
          {
            _id: data._id,
          },
          function(err, property) {
            if (!err) {
              if (!property) {
                var property = new Property(data);
                property.save();
              } else {
                property.Title = data.Title;
                property.Street = data.Street;
                property.City = data.City;
                property.State = data.State;
                property.ZipCode = data.ZipCode;
                property.OccupancyUse = data.OccupancyUse;
                property.ConstructionType = data.ConstructionType;
                property.Stories = data.Stories;
                property.YearConstructed = data.YearConstructed;
                property.Organization = data.Organization;
                property.PropertyManager = data.PropertyManager;
                property.QRCode = data.QRCode;
                property.Map = data.Map;
                property.Picture = data.Picture;
                property.Latitude = data.Latitude;
                property.Longitude = data.Longitude;
                //property.Buildings = data.Buildings;
                property.Contacts = data.Contacts;
                property.Status = data.Status;
                property.Adddate = data.AddDate;
                property.created_at = data.created_at;
                property.updated_at = data.updated_at;

                geocoder.geocode(
                  {
                    address:
                      property.Street +
                      ', ' +
                      property.City +
                      ', ' +
                      property.zipcode +
                      ', ' +
                      property.State,
                    zipcode: property.ZipCode,
                    city: property.City,
                  },
                  function(err, res) {
                    if (!err && res.length > 0) {
                      property.Latitude = res[0].latitude;
                      property.Longitude = res[0].longitude;
                    }

                    property.save();
                  }
                );
              }
            } else {
              logger.info(`properties.batch ${hash} error ${err}`);
            }
            callback(null);
          }
        );
      },
      function(err) {
        logger.info(`properties.batch ${hash} finish`);
        return reply({});
      }
    );
  },
};

exports.create = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      logger.info('properties.create unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`properties.create ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          logger.info(`properties.create ${hash} unauthorized no user`);
          return reply(Boom.unauthorized());
        }
      }
    );
    var property = new Property(request.payload);
    property.save(function(err, property) {
      if (!err) {
        logger.info(`properties.create ${hash} saved new`);
        return reply(property).created('/property/' + property._id); // HTTP 201
      }
      logger.info(`properties.create ${hash} ${err}`);
      if (11000 === err.code || 11001 === err.code) {
        return reply(
          Boom.forbidden('please provide another id, it already exist')
        );
      }
      return reply(Boom.forbidden('Error: ' + err)); // HTTP 403
    });
  },
};

exports.update = {
  handler: function(request, reply) {
    var hash = request.query.hash;
    if (!hash) {
      logger.info('properties.update unauthorized no hash');
      return reply(Boom.unauthorized());
    }
    logger.info(`properties.update ${hash} request`);
    User.findOne(
      {
        _id: hash,
      },
      function(err, user) {
        if (!user) {
          logger.info(`properties.update ${hash} unauthorized no user`);
          return reply(Boom.unauthorized());
        }
      }
    );
    Property.findOne(
      {
        _id: request.params.PropertyID,
      },
      function(err, property) {
        if (!err) {
          property.Title = request.payload.Title;
          property.Street = request.payload.Street;
          property.City = request.payload.City;
          property.State = request.payload.State;
          property.ZipCode = request.payload.ZipCode;
          property.OccupancyUse = request.payload.OccupancyUse;
          property.ConstructionType = request.payload.ConstructionType;
          property.Stories = request.payload.Stories;
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

          geocoder.geocode(
            {
              address:
                property.Street +
                ', ' +
                property.City +
                ', ' +
                property.zipcode +
                ', ' +
                property.State,
              zipcode: property.ZipCode,
              city: property.City,
            },
            function(err, res) {
              if (!err && res.length > 0) {
                property.Latitude = res[0].latitude;
                property.Longitude = res[0].longitude;
              }

              property.save(function(err, property) {
                if (!err) {
                  logger.info(`properties.update ${hash} saved`);
                  return reply(property); // HTTP 201
                }
                logger.info(`properties.update ${hash} ${err}`);
                if (11000 === err.code || 11001 === err.code) {
                  return reply(
                    Boom.forbidden(
                      'please provide another id, it already exist'
                    )
                  );
                }
                return reply(Boom.forbidden(err)); // HTTP 403
              });
            }
          );
        } else {
          logger.info(`properties.update ${hash} ${err}`);
          return reply(Boom.badImplementation(err)); // 500 error
        }
      }
    );
  },
};
