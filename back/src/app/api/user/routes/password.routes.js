'use strict';

const PasswordController = require("../controller/password.controller");

const PASSWORD_ROUTES = [
    { method: 'POST', path: '/password', config: PasswordController.reset },
    { method: 'GET', path: '/password', config: PasswordController.reset },
];

module.exports = PASSWORD_ROUTES;
