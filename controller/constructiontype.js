/**
 * Created by Zeus on 09/03/16.
 */

var Boom = require('boom');
var ConstructionType = require('../schema/constructiontype').ConstructionType;
var User = require('../schema/user').User;

exports.all = {
  handler: function(request, reply) {
    ConstructionType.find({}, function(err, constructiontypes) {
      if (!err) {
        return reply(constructiontypes);
      }
      return reply(Boom.badImplementation(err)); // 500 error
    });
  },
};

exports.get = {
  handler: function(request, reply) {
    ConstructionType.findOne(
      { _id: request.params.ConstructionTypeID },
      function(err, constructiontype) {
        if (!err) {
          return reply(constructiontype);
        }
        return reply(Boom.badImplementation(err)); // 500 error
      }
    );
  },
};

exports.create = {
  handler: function(request, reply) {
    var constructiontype = new ConstructionType(request.payload);
    constructiontype.save(function(err, constructiontype) {
      if (!err) {
        return reply(constructiontype).created(
          '/constructiontype/' + constructiontype._id
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
    ConstructionType.findOne(
      { _id: request.params.ConstructionTypeID },
      function(err, constructiontype) {
        if (!err) {
          constructiontype.Title = request.payload.Title;
          constructiontype.save(function(err, constructiontype) {
            if (!err) {
              return reply(constructiontype); // HTTP 201
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
      }
    );
  },
};
