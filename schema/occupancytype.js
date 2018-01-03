/**
 * Created by Zeus on 10/03/16.
 */
'use strict';

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var OccupancyTypeSchema = new schema({
    OccupancyTypeID: {type: Number},
    Title: {type: String, required: true}
});

var occupancytype = mongoose.model('OccupancyTypes', OccupancyTypeSchema);

/** export schema **/
module.exports = {
    OccupancyType : occupancytype
};