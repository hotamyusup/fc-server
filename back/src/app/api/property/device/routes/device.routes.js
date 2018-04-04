'use strict';

const DeviceController = require("../controller/device.controller");

const DEVICE_ROUTES = [
    {method: 'GET', path: '/devices', config: DeviceController.all},
    {method: 'POST', path: '/devices', config: DeviceController.upsert},
    {method: 'POST', path: '/devices/{DeviceID}', config: DeviceController.update},
    {method: 'POST', path: '/devices/batch', config: DeviceController.batch},
];
module.exports = DEVICE_ROUTES;