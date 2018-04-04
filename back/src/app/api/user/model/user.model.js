'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    Type: {type: String},
    Organization: {type: String},
    Title: {type: String},
    Email: {type: String},
    Phone: {type: String},
    Password: {type: String},
    Picture: {type: String}
});

UserSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.Password = '*****';
        return ret;
    }
});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
