'use strict';

const moment = require("moment");
const _ = require('lodash');

const RedirectOnCreateController = require("../../../core/redirect-on-create.controller");
const logger = require("../../../core/logger");
const PropertyDAO = require("../../property/property/dao/property.dao");

const UserDAO = require("../dao/user.dao");

class UserController extends RedirectOnCreateController {
    constructor() {
        super(UserDAO);
        this.controllerName = 'UserController';
        this.requestIDKey = 'UserID';
        this.batchEntitiesKey = '';

        this.redirectUrl = '/user/';
    }

    get all() {
        return {
            handler: async (request, reply) => {
                const {hash} = request.query;
                const action = 'all';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                const {from, sort, limit, skip} = request.query;

                const options = {
                    sort: sort ? JSON.parse(decodeURIComponent(sort)) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    skip: skip ? parseInt(skip) : undefined
                };

                const conditions = {};
                if (from) {
                    conditions.updated_at = {
                        $gt: moment(from).toDate()
                    }
                }

                const properties = await PropertyDAO.all({PropertyManager: {$ne: null}});
                const propertyManager2Properties = _.groupBy(properties, 'PropertyManager');

                const users = await this.DAO.all(conditions, options);
                const usersJSON = [];
                for (const user of users) {
                    const userJSON = user.toJSON();
                    const userProperties = propertyManager2Properties[user._id];
                    if (userProperties) {
                        userJSON.Properties = userJSON.Properties || [];
                        userJSON.Properties.push(...userProperties.map(property => property._id));
                    }

                    usersJSON.push(userJSON);
                }

                return this.handle('all', request, reply, usersJSON);
            }
        };
    }

    get get() {
        return {
            handler: async (request, reply) => {
                const user = await this.DAO.get(request.params[this.requestIDKey]);
                const userJSON = user.toJSON();
                const properties = await PropertyDAO.getPropertiesForPropertyManager(user._id);
                userJSON.Properties = [...properties.map(property => property._id)];

                return this.handle('get', request, reply, userJSON);
            }
        };
    }

    get list() {
        return {
            handler: (request, reply) => this.handle(
                'list',
                request,
                reply,
                UserDAO.getOrganizationUsers(request.params.OrganizationID)
            )
        };
    }


    get login() {
        return {
            auth : false,
            handler: (request, reply) => {
                const {hash} = request.query;
                const action = 'login';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start`);

                if (request.payload.Email == '' || request.payload.Password == '') {
                    logger.info(`sessionId: ${hash} ${this.controllerName}.${action} failed, email ${request.payload.Email} or password ${request.payload.Password} not received`);
                    return reply('0');
                }

                return UserDAO.login(request.payload.Email, request.payload.Password)
                    .then(user => {
                        if (user) {
                            logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                            return reply(user);
                        } else {
                            logger.info(`sessionId: ${hash} ${this.controllerName}.${action} failed, user not found`);
                            return reply('0');
                        }
                    })
                    .catch(err => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });
            }
        };
    }
}

module.exports = new UserController();
