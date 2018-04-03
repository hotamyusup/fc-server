'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PhotoSchema = new Schema({
    URL: {type:String}
});

module.exports = PhotoSchema;