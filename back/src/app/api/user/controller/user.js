/**
 * Created by Zeus on 09/03/16.
 */

var Boom = require('boom');
var User = require('../schema/user').User;
var Login = require('../schema/user').Login;

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
    User.find({}, function(err, users) {
      if (!err) {
        for (var i = 0; i < users.length; i++) {
          users[i].Password = '*****';
        }
        return reply(users);
      }
      return reply(Boom.badImplementation(err)); // 500 error
    });
  },
};

exports.list = {
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
    User.find({ Organization: request.params.OrganizationID }, function(
      err,
      users
    ) {
      if (!err) {
        return reply(users);
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
    User.findOne({ _id: request.params.UserID }, function(err, user) {
      if (!err) {
        return reply(user);
      }
      return reply(Boom.badImplementation(err)); // 500 error
    });
  },
};

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
    var user = new User(request.payload);
    user.save(function(err, user) {
      if (!err) {
        return reply(user).created('/user/' + user._id); // HTTP 201
      }
      if (11000 === err.code || 11001 === err.code) {
        return reply(
          Boom.forbidden('please provide another question id, it already exist')
        );
      }
      return reply(Boom.forbidden(err)); // HTTP 403
    });
  },
};

exports.login = {
  handler: function(request, reply) {
    if (request.payload.Email == '' || request.payload.Password == '') {
      return reply('0');
    }

    User.findOne(
      { Email: request.payload.Email, Password: request.payload.Password },
      function(err, user) {
        if (user) {
          user.Password = '*****';
          return reply(user);
        } else {
          return reply('0');
        }
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
    User.findOne({ _id: hash }, function(err, user) {
      if (!user) {
        return reply(Boom.unauthorized());
      }
    });
    User.findOne({ _id: request.params.UserID }, function(err, user) {
      if (!err) {
        user.Title = request.payload.Title;
        user.Email = request.payload.Email;
        user.Phone = request.payload.Phone;
        user.Type = request.payload.Type;
        user.Password =
          request.payload.Password == '*****'
            ? user.Password
            : request.payload.Password;
        user.Organization = request.payload.Organization;
        user.Picture = request.payload.Picture;
        user.save(function(err, user) {
          if (!err) {
            return reply(user); // HTTP 201
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
