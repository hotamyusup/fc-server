/**
 * Created by Zeus on 10/03/16.
 */
'use strict';

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var DeviceSchema = new schema({
    Title: {type: String},
    Color:{type:String},
    Status:{type: Number}
});

var EquipmentSchema = new schema({
    Title: {type: String},
    Devices: [DeviceSchema]
});

var equipment = mongoose.model('Equipments', EquipmentSchema);
var device = mongoose.model('EquipmentDevices', DeviceSchema);

/** export schema **/
module.exports = {
    Equipment : equipment,
    Device: device
};
