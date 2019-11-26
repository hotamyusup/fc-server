'use strict';

const Boom = require('boom');
const _ = require('underscore');
const UserDAO = require("../api/user/dao/user.dao");
const OrganizationDAO = require("../api/organization/dao/organization.dao");


exports.register = (plugin, options, next) => {
    plugin.auth.scheme('hash', authorize);
    next();
};

exports.register.attributes = {
    pkg: require('../../../package.json')
};

const authorize = (server) => {
    const scheme = {
        authenticate: function (request, reply) {
            const hash = request.query.hash;
            if (hash) {
                UserDAO
                    .get({_id: hash})
                    .then(user => {
                        if (!user) {
                            throw new Error('unauthorized');
                        } else {
                            OrganizationDAO
                                .isActive(user.Organization)
                                .then(isOrganizationActive => {
                                    if (isOrganizationActive) {
                                        reply.continue({credentials: user});
                                    } else {
                                        reply(Boom.unauthorized())
                                    }
                                })
                        }
                    })
                    .catch(error => {
                        console.log('Auth error ' + error);
                        reply(Boom.unauthorized())
                    });
            } else {
                reply(Boom.unauthorized());
            }
        }
    };

    return scheme;
};
