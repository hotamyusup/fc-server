'use strict';

const UserController = require("../controller/user.controller");
const FCMDeviceTokenController = require("../controller/fcm-device-token.controller");

const USER_ROUTES = [
    {method: 'GET', path: '/users', config: UserController.all},
    {method: 'GET', path: '/users/{UserID}', config: UserController.get},
    {method: 'POST', path: '/users/login', config: UserController.login},
    {method: 'POST', path: '/users/{UserID}', config: UserController.update},
    {method: 'POST', path: '/users', config: UserController.create},
    {method: 'DELETE', path: '/users/{UserID}', config: UserController.delete},
    {method: 'POST', path: '/me/addTokenToUser', config: FCMDeviceTokenController.addTokenToUser},
    {method: 'POST', path: '/me/deleteTokenFromUser', config: FCMDeviceTokenController.deleteTokenFromUser},
];

module.exports = USER_ROUTES;
