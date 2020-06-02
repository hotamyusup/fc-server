'use strict';

const _ = require('underscore');
const mongoose = require('mongoose');
const Promise = require('bluebird');

const logger = require("../../../core/logger");
const BaseDAO = require("../../../core/base.dao");

const UserModel = require("../model/user.model");
const FCMDeviceTokenSchema = require("../model/fcm-device-token.schema");

class FCMDeviceTokenDAO extends BaseDAO {
    constructor() {
        super(UserModel);
    }

    async prepareUpdateObject(dataObject) {
        const preparedDataObject = await super.prepareUpdateObject(dataObject);
        return preparedDataObject;
    }

    async deleteToken(userID, fcmToken) {
        if (!userID || !fcmToken) {
            throw new Error('userID and fcmToken are required');
        }

        const user = await UserModel.findOne({_id: userID});
        if (!user) {
            throw new Error(`User with id === ${userID} not found`);
        } else {
            if (!user.FCMTokens) {
                user.FCMTokens = [];
            }

            if (_.filter(user.FCMTokens, {Token: fcmToken}).length) {
                user.FCMTokens = [..._.reject(user.FCMTokens, {Token: fcmToken})];
                return user.save();
            }
        }
    }

    async upsertToken(userID, fcmToken, userAgent) {
        if (!userID || !fcmToken) {
            throw new Error('userID and fcmToken are required');
        }

        const user = await UserModel.findOne({_id: userID});
        if (!user) {
            throw new Error(`User with id === ${userID} not found`);
        } else {
            if (!user.FCMTokens) {
                user.FCMTokens = [];
            }

            if (_.where(user.FCMTokens, {Token: fcmToken}).length) {
                throw new Error(`This Token (${fcmToken}) already bind to current user (${userID})`)
            }

            const newToken = {UserAgent: userAgent, Token: fcmToken, created_at: new Date()};

            user.FCMTokens = [...user.FCMTokens, newToken];

            return user.save();
        }
    }
}

module.exports = new FCMDeviceTokenDAO();
