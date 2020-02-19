'use strict';

const Promise = require('bluebird');

const logger = require("../../../../core/logger");

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");

const FloorDAO = require("../dao/floor.dao");
const DeviceDAO = require("../../device/dao/device.dao");

class FloorController extends PropertyChildrenBaseController {
    constructor() {
        super(FloorDAO);
        this.controllerName = 'FloorController';
        this.requestIDKey = 'FloorID';
        this.batchEntitiesKey = 'floors';
    }

    get duplicate() {
        return {
            handler: (request, reply) => this.handle('duplicate', request, reply, this.DAO.create(request.payload.content))
        }
    }

    get copy() {
        return {
            handler: (request, reply) => {
                return this.handle('copy', request, reply, (async () => {
                    const floorID = request.params[this.requestIDKey];
                    const devices = await DeviceDAO.forFloor(floorID);

                    const floorCopy = await this.DAO.copy(floorID, {Title: ({Title}) => `Copy of ${Title}`});
                    await Promise.map(devices, async device => {
                        await DeviceDAO.copy(device, {FloorID: floorCopy._id});
                    }, {concurrency: 5});

                    return floorCopy;
                })())

            }
        }
    }
}

module.exports = new FloorController();
