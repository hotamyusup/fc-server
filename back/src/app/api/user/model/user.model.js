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

const LoginSchema = new schema({
    Email: {type: String},
    Password: {type: String}
});


module.exports = {
    UserModel: mongoose.model('Users', UserSchema),
    LoginModel: mongoose.model('Login', LoginSchema)
};