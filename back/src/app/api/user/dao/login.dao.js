'use strict';

const BaseDAO = require("../../../../core/base.dao");
const LoginModel = require("../model/login.model");

module.exports = new BaseDAO(LoginModel);