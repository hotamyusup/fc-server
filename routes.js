/**
 * Created by Zeus on 09/03/16.
 */

const Property = require('./controller/property');
const Building = require('./controller/building');
const Floor = require('./controller/floor');
const Device = require('./controller/device');
const Record = require('./controller/record');
const Organization = require('./controller/organization');
const ConstructionType = require('./controller/constructiontype');
const OccupancyType = require('./controller/occupancytype');
const User = require('./controller/user');
const Equipment = require('./controller/equipment');
const Image = require('./controller/image');
const Path = require('path');
const Service = require('./controller/service');
const Password = require('./controller/password');

require('./schema/property').Property;
require('./schema/organization').Organization;
require('./schema/constructiontype').ConstructionType;
require('./schema/occupancytype').OccupancyType;
require('./schema/user').User;
require('./schema/equipment').Equipment;

// API Server Endpoints
exports.endpoints = [
  {
    method: 'GET',
    path: '/img/{param*}',
    handler: {
      directory: { path: Path.normalize(__dirname + '/img') },
    },
  },
  {
    method: 'GET',
    path: '/admin/{param*}',
    handler: {
      directory: { path: Path.normalize(__dirname + '/admin') },
    },
  },
  {
    method: 'POST',
    path: '/admin/{param*}',
    handler: {
      directory: { path: Path.normalize(__dirname + '/admin') },
    },
  },
  { method: 'POST', path: '/properties', config: Property.upsert },
  { method: 'GET', path: '/properties/processed', config: Property.processed },
  { method: 'POST', path: '/properties/{PropertyID}', config: Property.update },
  { method: 'POST', path: '/properties/batch', config: Property.batch },
  { method: 'GET', path: '/properties', config: Property.all },
  { method: 'GET', path: '/properties/{PropertyID}', config: Property.get },

  { method: 'POST', path: '/records', config: Record.create },
  { method: 'POST', path: '/records/batch', config: Record.batch },

  { method: 'POST', path: '/devices', config: Device.upsert },
  { method: 'POST', path: '/devices/{DeviceID}', config: Device.update },
  { method: 'POST', path: '/devices/batch', config: Device.batch },

  { method: 'POST', path: '/floors', config: Floor.upsert },
  { method: 'POST', path: '/floors/{FloorID}', config: Floor.update },
  { method: 'POST', path: '/floors/batch', config: Floor.batch },
  { method: 'POST', path: '/floors/duplicate', config: Floor.duplicate },

  { method: 'POST', path: '/buildings', config: Building.upsert },
  { method: 'POST', path: '/buildings/{BuildingID}', config: Building.update },
  { method: 'POST', path: '/buildings/batch', config: Building.batch },

  { method: 'GET', path: '/organizations', config: Organization.all },
  {
    method: 'GET',
    path: '/organizations/{OrganizationID}',
    config: Organization.get,
  },
  {
    method: 'GET',
    path: '/organizations/{OrganizationID}/users',
    config: User.list,
  },

  { method: 'POST', path: '/organizations', config: Organization.create },
  {
    method: 'POST',
    path: '/organizations/{OrganizationID}',
    config: Organization.update,
  },

  { method: 'GET', path: '/constructiontypes', config: ConstructionType.all },
  {
    method: 'GET',
    path: '/constructiontypes/{ConstructionTypeID}',
    config: ConstructionType.get,
  },

  {
    method: 'POST',
    path: '/constructiontypes',
    config: ConstructionType.create,
  },
  {
    method: 'POST',
    path: '/constructiontypes/{ConstructionTypeID}',
    config: ConstructionType.update,
  },

  { method: 'GET', path: '/occupancytypes', config: OccupancyType.all },
  {
    method: 'GET',
    path: '/occupancytypes/{OccupancyTypeID}',
    config: OccupancyType.get,
  },

  { method: 'POST', path: '/occupancytypes', config: OccupancyType.create },
  {
    method: 'POST',
    path: '/occupancytypes/{OccupancyTypeID}',
    config: OccupancyType.update,
  },

  { method: 'GET', path: '/users', config: User.all },
  { method: 'GET', path: '/users/{UserID}', config: User.get },
  { method: 'POST', path: '/users', config: User.create },
  { method: 'POST', path: '/users/{UserID}', config: User.update },
  { method: 'POST', path: '/users/login', config: User.login },

  { method: 'GET', path: '/equipments', config: Equipment.all },
  { method: 'GET', path: '/equipments/{EquipmentID}', config: Equipment.get },

  { method: 'POST', path: '/equipments', config: Equipment.create },
  {
    method: 'POST',
    path: '/equipments/{EquipmentID}',
    config: Equipment.update,
  },
  {
    method: 'POST',
    path: '/equipments/delete/{EquipmentID}',
    config: Equipment.delete,
  },
  {
    method: 'POST',
    path: '/equipments/device/{EquipmentID}',
    config: Equipment.upsertdevice,
  },
  {
    method: 'POST',
    path: '/equipments/device/{EquipmentID}/{DeviceID}',
    config: Equipment.upsertdevice,
  },

  { method: 'POST', path: '/service', config: Service.send },
  { method: 'GET', path: '/service', config: Service.send },

  { method: 'POST', path: '/password', config: Password.reset },
  { method: 'GET', path: '/password', config: Password.reset },

  {
    method: 'POST',
    path: '/image',
    config: Image.save,
  },
];
