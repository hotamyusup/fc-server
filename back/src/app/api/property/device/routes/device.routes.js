'use strict';

const DeviceController = require("../controller/device.controller");

const DEVICE_ROUTES = [
    {method: 'GET', path: '/devices/export-csv', config: DeviceController.exportCSV},
    {method: 'GET', path: '/devices/qr/{QRCode}', config: DeviceController.findByQR},
    {method: 'GET', path: '/devices', config: DeviceController.all},
    {method: 'GET', path: '/devices/{DeviceID}', config: DeviceController.get},
    {method: 'POST', path: '/devices', config: DeviceController.upsert},
    {method: 'POST', path: '/devices/{DeviceID}', config: DeviceController.update},
    {method: 'POST', path: '/devices/batch', config: DeviceController.batch},
    {method: 'POST', path: '/devices/getBatch', config: DeviceController.getBatch},
    {method: 'POST', path: '/devices/alarmData', config: DeviceController.alarmData},
];

module.exports = DEVICE_ROUTES;
