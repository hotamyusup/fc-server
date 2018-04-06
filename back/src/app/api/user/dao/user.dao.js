'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

const BaseDAO = require("../../../core/base.dao");
const logger = require("../../../core/logger");

const UserModel = require("../model/user.model");

class UserDAO extends BaseDAO {
    constructor() {
        super(UserModel);
    }

    async prepareUpdateObjecut(dataObject) {
        const preparedDataObject = await super.prepareUpdateObject(dataObject);

        if (dataObject.Password == '*****') {
            delete dataObject.Password;
        }

        return preparedDataObject;
    }

    getOrganizationUsers(organizationID) {
        return UserModel.find({Organization: organizationID});
    }

    findUserByEmail(email) {
        return UserModel.findOne({Email: email});
    }

    login(email, password) {
        return UserModel.findOne({Email: email, Password: password});
    }
}

module.exports = new UserDAO();
