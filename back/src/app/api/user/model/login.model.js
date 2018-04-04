'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoginSchema = new Schema({
    Email: {type: String},
    Password: {type: String}
});

const LoginModel = mongoose.model('Login', LoginSchema);
module.exports = LoginModel;