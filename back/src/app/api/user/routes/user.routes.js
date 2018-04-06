'use strict';

const UserController = require("../controller/user.controller");

const USER_ROUTES = [
    {method: 'GET', path: '/users', config: UserController.all},
    {method: 'GET', path: '/users/{UserID}', config: UserController.get},
    {method: 'POST', path: '/users/login', config: UserController.login},
    {method: 'POST', path: '/users/{UserID}', config: UserController.update},
    {method: 'POST', path: '/users', config: UserController.create},
];

module.exports = USER_ROUTES;
