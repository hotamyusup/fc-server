'use strict';

const OrganizationController = require("../controller/organization.controller");
const UserController = require("../../user/controller/user.controller");

const ORGANIZATION_ROUTES = [
    {method: 'GET', path: '/organizations', config: OrganizationController.all},
    {method: 'GET', path: '/organizations/{OrganizationID}', config: OrganizationController.get},
    {method: 'GET', path: '/organizations/{OrganizationID}/users', config: UserController.list},
    {method: 'POST', path: '/organizations', config: OrganizationController.create},
    {method: 'POST', path: '/organizations/{OrganizationID}', config: OrganizationController.update},
];

module.exports = ORGANIZATION_ROUTES;
