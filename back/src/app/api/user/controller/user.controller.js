'use strict';

const RedirectOnCreateController = require("../../../core/redirect-on-create.controller");
const logger = require("../../../core/logger");

const UserDAO = require("../dao/user.dao");

class UserController extends RedirectOnCreateController {
    constructor() {
        super(UserDAO);
        this.controllerName = 'UserController';
        this.requestIDKey = 'UserID';
        this.batchEntitiesKey = '';

        this.redirectUrl = '/user/';
    }

    get list() {
        return {
            handler: (request, reply) => this.handle('list', request, reply, UserDAO.getOrganizationUsers(request.params.OrganizationID))
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
