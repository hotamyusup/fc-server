'use strict';

const EquipmentController = require("../controller/equipment.controller");

const EQUIPMENTS_ROUTES = [

    {method: 'GET', path: '/equipments', config: EquipmentController.all},
    {method: 'GET', path: '/equipments/{EquipmentID}', config: EquipmentController.get},

    {method: 'POST', path: '/equipments', config: EquipmentController.create},
    {method: 'POST', path: '/equipments/{EquipmentID}', config: EquipmentController.update},

    {method: 'POST', path: '/equipments/delete/{EquipmentID}', config: EquipmentController.delete},
    {method: 'POST', path: '/equipments/device/{EquipmentID}', config: EquipmentController.upsertDevice},
    {method: 'POST', path: '/equipments/device/{EquipmentID}/{DeviceID}', config: EquipmentController.upsertDevice},
];

module.exports = EQUIPMENTS_ROUTES;