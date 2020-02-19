'use strict';

const _ = require('underscore');
const Promise = require('bluebird');
const Boom = require('boom');

const logger = require("../../../../core/logger");

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");

const BuildingDAO = require("../dao/building.dao");
const FloorDAO = require("../../floor/dao/floor.dao");
const DeviceDAO = require("../../device/dao/device.dao");

class BuildingController extends PropertyChildrenBaseController {
    constructor() {
        super(BuildingDAO);
        this.controllerName = 'BuildingController';
        this.requestIDKey = 'BuildingID';
        this.batchEntitiesKey = 'buildings';
    }

    get copy() {
        return {
            handler: (request, reply) => {
                return this.handle('copy', request, reply, (async () => {
                    const buildingID = request.params[this.requestIDKey];
                    const [floors, devices] = await Promise.all([
                        FloorDAO.forBuilding(buildingID),
                        DeviceDAO.forBuilding(buildingID)
                    ]);

                    const buildingCopy = await this.DAO.copy(buildingID, {Title: ({Title}) => `Copy of ${Title}`});
                    await Promise.map(floors, async floor => {
                        await FloorDAO.copy(floor, {BuildingID: buildingCopy._id});
                        const floorDevices = _.filter(devices, device => `${device.FloorID}` === `${floor._id}`);
                        await Promise.map(floorDevices, async device => {
                            await DeviceDAO.copy(device, {BuildingID: buildingCopy._id, FloorID: floor._id});
                        }, {concurrency: 5});
                    }, {concurrency: 5});

                    return buildingCopy;
                })())

            }
        }
    }
}

module.exports = new BuildingController();
/*
function Copy(e) {
    View.add(LoadingContainer);
    const Mode = e.item.value;

    Building = Alloy.Globals.GetBuilding(Building._id);
    const buildingCopy = Building.copy();
    buildingCopy.save();

    _.forEach(Building.Floors, floor => {
        const copyFloor = floor.copy();
        copyFloor.Title = floor.Title;
        copyFloor.BuildingID = buildingCopy._id;
        copyFloor.save();

        _.forEach(floor.Devices, device => {
            const copyDevice = device.copy();
            copyDevice.Title = device.Title;
            copyDevice.FloorID = copyFloor._id;
            copyDevice.BuildingID = buildingCopy._id;

            if (Mode == 2) {
                copyDevice.XPos = 726 - copyDevice.XPos;
            } else if (Mode == 3) {
                copyDevice.YPos = 926 - copyDevice.YPos;
            } else if (Mode == 4) {
                copyDevice.XPos = 726 - copyDevice.XPos;
                copyDevice.YPos = 926 - copyDevice.YPos;
            }

            copyDevice.save();
        })
    });

    Alloy.Globals.sync()
        .then(() => Alloy.Globals.Alert("Building copied!"))
        .finally(() => View.remove(LoadingContainer));
}

 */
