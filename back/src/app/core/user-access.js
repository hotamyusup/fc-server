const Boom = require('boom');
const {User} = require('./schema/user');
const logger = require('./logger');
const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');

const checkAccess = (_id) => {
    if (!_id) {
        logger.error(`unauthorized: no hash ${_id}`);
        throw new Error("unauthorized");
    } else {
        return User.findOne({_id})
            .exec()
            .then(user => {
                if (!user) {
                    throw new Error("unauthorized")
                }
                return user;
            });
    }
};

const isAuthorized = (request, reply, action) => {
    const {hash} = request.query;
    return checkAccess(hash)
        .catch(e => {
            logger.error(`properties.get ${hash} unauthorized no user`, e);
            reply(Boom.unauthorized());
        })
};


exports.checkAccess = checkAccess;
exports.isAuthorized = isAuthorized;
