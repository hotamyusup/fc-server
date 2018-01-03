/**
 * Created by Zeus on 10/03/16.
 */
'use strict';

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var UserSchema = new schema({
    Type: {type: String},
    Organization: {type: String},
    Title: {type: String},
    Email: {type: String},
    Phone: {type: String},
    Password: {type: String},
    Picture:{type: String}
});

var LoginSchema = new schema({
    Email: {type: String},
    Password: {type: String}
});

var user = mongoose.model('Users', UserSchema);
var login = mongoose.model('Login', LoginSchema);



/** export schema **/
module.exports = {
    User : user,
    Login: login
};