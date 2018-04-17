'use strict';

const Promise = require('bluebird');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const DeviceDAO = require("../dao/device.dao");

class DeviceController extends BaseController {
    constructor() {
        super(DeviceDAO);
        this.controllerName = 'DeviceController';
        this.requestIDKey = 'DeviceID';
        this.batchEntitiesKey = 'devices';
    }

    get findByQR() {
        return {
            auth: false,
            handler: (request, reply) => {
                const getDeviceByQRCode = this.DAO.findByQR(request.params.QRCode)
                    .populate('PropertyID', {Title : 1})
                    .populate('BuildingID', {Title : 1})
                    .populate('FloorID', {Map : 1, Title: 1})
                    .then(device => {
                        if (device) {
                            device = device.toJSON();

                            if (device.PropertyID) {
                                device.Property = device.PropertyID;
                                device.PropertyID = device.Property._id;
                            }
                            if (device.BuildingID) {
                                device.Building = device.BuildingID;
                                device.BuildingID = device.Building._id;
                            }
                            if (device.FloorID) {
                                device.Floor = device.FloorID;
                                device.FloorID = device.Floor._id;
                            }
                        }

                        return device || null;
                    });
                this.handle('findByQR', request, reply, getDeviceByQRCode);
            }
        };
    }
}

module.exports = new DeviceController();