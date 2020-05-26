'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const FCMDeviceTokenSchema = require("./fcm-device-token.schema");

const UserSchema = new Schema({
    Type: {type: String},
    Organization: {type: Schema.Types.ObjectId, ref: 'Organization'},
    Title: {type: String},
    Email: {type: String},
    Phone: {type: String},
    Password: {type: String},
    Picture: {type: String},
    FCMTokens: {type: [FCMDeviceTokenSchema]}
});

UserSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.Password = '*****';
        delete ret.FCMTokens;
        return ret;
    }
});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
