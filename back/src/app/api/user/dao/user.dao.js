'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

const BaseDAO = require("../../../core/base.dao");
const logger = require("../../../core/logger");

const UserModel = require("../model/user.model");
const OrganizationDAO = require("../../organization/dao/organization.dao");

class UserDAO extends BaseDAO {
    constructor() {
        super(UserModel);
    }

    async prepareUpdateObject(dataObject) {
        const preparedDataObject = await super.prepareUpdateObject(dataObject);

        if (dataObject.Password == '*****') {
            delete dataObject.Password;
        }

        return preparedDataObject;
    }

    getOrganizationUsers(organizationID) {
        return UserModel.find({Organization: organizationID});
    }

    getUsersByTypes(usersTypes) {
        return UserModel.find({Type: {$in: usersTypes}});
    }

    findUserByEmail(email) {
        const $regex = new RegExp(email, "i");
        return UserModel.findOne({Email: {$regex}});
    }

    async login(email, password) {
        const $regex = new RegExp(email, "i");
        const loggedInUser = await UserModel.findOne({Email: {$regex}, Password: password});

        if (loggedInUser) {
            const isOrganizationActive = await OrganizationDAO.isActive(loggedInUser.Organization);
            if (isOrganizationActive) {
                return loggedInUser;
            } else {
                logger.warn(`User "${email}" try to access inactive Organization with id "${loggedInUser.Organization}"`);
                return null;
            }
        } else {
            return null;
        }
    }
}

module.exports = new UserDAO();
