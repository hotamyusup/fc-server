/**
 * Created by Zeus on 10/03/16.
 */
'use strict';

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var OrganizationSchema = new schema({
    Title: {type: String, required: true}
});

var organization = mongoose.model('Organizations', OrganizationSchema);



/** export schema **/
module.exports = {
    Organization : organization
};