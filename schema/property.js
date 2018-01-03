/**
 * Created by Zeus on 09/03/16.
 */
'use strict';

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var PhotoSchema = new schema({
    URL: {type:String}
});

var InspectionSchema = new schema({
    Frequency: {type: String},
    DeviceStatus: {type: Number},
    Reason: {type: String},
    Note: {type: String},
    InspectionDate: {type:Date},
    Status: {type:Number},
    User: {type:String},
    Photos: [PhotoSchema],
    created_at: {type: Date},
    updated_at: {type: Date}
});


var MapSchema = new schema({
    Scale: {type: Number},
    Left: {type: Number},
    Px:{type: Number},
    Py:{type: Number},
    Top: {type: Number}
});

var DeviceSchema = new schema({
    EquipmentType: {type: String},
    DeviceType: {type: String},
    ModelNumber: {type: String},
    SerialNumber: {type: String},
    InstallationDate: {type: Date},
    DeviceLocation: {type: String},
    Notes: {type: String},
    QRCode: {type: String},
    Picture: {type: String},
    XPos: {type: Number},
    YPos: {type: Number},
    Records:[InspectionSchema],
    Status: {type:Number},
    created_at: {type: Date},
    updated_at: {type: Date}
});

var FloorSchema = new schema({
    Title: {type: String},
    Map: MapSchema,
    XPos: {type: Number},
    YPos: {type: Number},
    Devices:[DeviceSchema],
    Status: {type:Number},
    created_at: {type: Date},
    updated_at: {type: Date}
});

var BuildingSchema = new schema({
    Title: {type: String},
    Map: MapSchema,
    XPos: {type: Number},
    YPos: {type: Number},
    Picture: {type: String},
    Floors:[FloorSchema],
    Status: {type:Number},
    created_at: {type: Date},
    updated_at: {type: Date}
});

var ContactSchema = new schema({
    Title: {type: String},
    Email: {type: String},
    Phone: {type: String}
});

var PropertySchema = new schema({
    Title: {type: String},
    Street: {type: String},
    City: {type: String},
    State: {type: String},
    ZipCode: {type: String},
    OccupancyUse: {type: String},
    ConstructionType: {type: String},
    Stories: {type: String},
    YearConstructed: {type: String},
    Organization: {type: String},
    Client: {type: String},
    PropertyManager: {type: String},
    QRCode: {type: String},
    Map: {type: String},
    Picture: {type: String},
    Buildings: [BuildingSchema],
    Contacts: [ContactSchema],
    Latitude:{type:String},
    Longitude:{type:String},
    AddDate:{type:Date},
    UpdateDate:{type:Date},
    Status:{type:Number},
    created_at: {type: Date},
    updated_at: {type: Date}
});

var property = mongoose.model('Properties', PropertySchema);
var building = mongoose.model('Buildings', BuildingSchema);
var floor = mongoose.model('Floors', FloorSchema);
var device = mongoose.model('Devices', DeviceSchema);
var inspection = mongoose.model('Records', InspectionSchema);

/** export schema **/
module.exports = {
    Property : property,
    Building: building,
    Floor: floor,
    Device: device,
    Inspection: inspection
};