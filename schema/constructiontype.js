/**
 * Created by Zeus on 10/03/16.
 */
'use strict';

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var ConstructionTypeSchema = new schema({
    ConstructionTypeID: {type: Number},
    Title: {type: String, required: true}
});

var constructiontype = mongoose.model('ConstructionTypes', ConstructionTypeSchema);

/** export schema **/
module.exports = {
    ConstructionType : constructiontype
};