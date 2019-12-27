const moment = require('moment');
const Promise = require('bluebird');
const _ = require('underscore');

const {db, Mongoose} = require('../../src/config/db');

const EquipmentDAO = require('../../src/app/api/property/device/dao/equipment.dao');
const EquipmentDeviceSchema = require('../../src/app/api/property/device/model/equipment-device.schema');
require('../../src/app/api/property/device/model/equipment.model');

const PropertyDAO = require('../../src/app/api/property/property/dao/property.dao');
const BuildingDAO = require('../../src/app/api/property/building/dao/building.dao');
const FloorDAO = require('../../src/app/api/property/floor/dao/floor.dao');
const DeviceDAO = require('../../src/app/api/property/device/dao/device.dao');
const InspectionDAO = require('../../src/app/api/property/inspection/dao/inspection.dao');

const onDBConnected = new Promise(resolve => db.once('open', resolve));
/**
 * run tool:
 * npm run tool inspections-move-by-date stats 5a4e6c74ade4ff780ab9084f 2019-12-17 2019-12-09
 * npm run tool inspections-move-by-date check 5a4e6c74ade4ff780ab9084f 2019-12-17 2019-12-09  56fa327ddfe0b7562268266d 56fa327ddfe0b75622682679
 * npm run tool inspections-move-by-date migrate 5a4e6c74ade4ff780ab9084f 2019-12-17 2019-12-09  56fa327ddfe0b7562268266d 56fa327ddfe0b75622682679
 */
module.exports = {
    run: async (command, locationID, inspectionsDate, inspectionsNewDate, ...inspectionsDeviceTypes) => {
        console.log('******************************************');
        console.log(`inspections-move-by-date | run(command = ${command}, locationID = ${locationID}, inspectionsDate = ${inspectionsDate}, inspectionsNewDate = ${inspectionsNewDate}, inspectionsDeviceType = ${JSON.stringify(inspectionsDeviceTypes)})`);

        if (['stats', 'check', 'migrate'].indexOf(command) === -1) {
            throw new Error(`command is not valid use 'stats' or 'migrate' values`);
        }

        await onDBConnected;

        let locationFilter;
        let property = await PropertyDAO.get(locationID);
        let building, floor;
        if (property) {
            locationFilter = {PropertyID: locationID};
            console.log(`locationID was Property = ${property.Title}`);
        } else {
            building = await BuildingDAO.get(locationID);
            if (building) {
                locationFilter = {BuildingID: locationID};
                property = await PropertyDAO.get(building.PropertyID);
                console.log(`locationID was Building = ${building.Title} / ${property.Title}`);
            } else {
                floor = await FloorDAO.get(locationID);
                if (floor) {
                    locationFilter = {FloorID: locationID};
                    building = await BuildingDAO.get(floor.BuildingID);
                    property = await PropertyDAO.get(floor.PropertyID);
                    console.log(`locationID was Floor = ${floor.Title} / ${building.Title} / ${property.Title}`);
                }
            }
        }

        if (!locationFilter) {
            throw new Error("Need to define location (Property, Building or Floor) of migration")
        }

        const diffInDays = moment(inspectionsNewDate).diff(inspectionsDate, 'day');

        const startDayTime = moment(inspectionsDate).startOf('day').toISOString();
        const endDayTime = moment(inspectionsDate).add(1, 'd').endOf('day').toISOString();
        console.log(`startDayTime = ${startDayTime}, endDayTime = ${endDayTime}, ${diffInDays} days difference`);

        if (command === 'stats') {
            const equipments = await EquipmentDAO.all();

            const deviceTypeById = {};
            equipments.forEach(equipmentType => {
                equipmentType.Devices.forEach(deviceType => {
                    deviceTypeById[deviceType._id] = deviceType;
                });
            });

            const inspectionsForDate = await InspectionDAO
                .all({
                    ...locationFilter,
                    InspectionDate: {$gte: startDayTime, $lte: endDayTime}
                })
                .populate('DeviceID');

            const inspectedDeviceTypes = {};
            inspectionsForDate.forEach(inspection => {
                const device = inspection.DeviceID;
                if (device) {
                    inspectedDeviceTypes[`${device.DeviceType}`] = inspectedDeviceTypes[`${device.DeviceType}`] ? inspectedDeviceTypes[`${device.DeviceType}`] + 1 : 1;
                }
            });

            console.log(`Inspections count for device types:`);
            Object.keys(inspectedDeviceTypes).forEach(deviceTypeID => {
                if (deviceTypeById[deviceTypeID]) {
                    console.log(` - ${inspectedDeviceTypes[deviceTypeID]}\t- ${deviceTypeById[deviceTypeID].Title} | ${deviceTypeById[deviceTypeID]._id}`);
                }
            });
            console.log('finished...');
        } else {
            const inspectionsForDate = await InspectionDAO
                .all({
                    ...locationFilter,
                    InspectionDate: {$gte: startDayTime, $lte: endDayTime}
                })
                .populate('DeviceID');

            console.log(`Found ${inspectionsForDate.length} inspections for this date`);

            const filteredInspectionsForDate = inspectionsForDate.filter(inspection => {
                const device = inspection.DeviceID;
                const EquipmentType = device && `${device.EquipmentType}`;
                const DeviceType = device && `${device.DeviceType}`;
                return (inspectionsDeviceTypes.indexOf(EquipmentType) >= 0)
                    || (inspectionsDeviceTypes.indexOf(DeviceType) >= 0)
            });

            console.log(`Found ${filteredInspectionsForDate.length} inspections to move`);
            if (command === 'migrate') {
                if (filteredInspectionsForDate.length) {
                    console.log(`Going to migrate ${filteredInspectionsForDate.length} inspections`);
                    const inspectionsToUpdate = InspectionDAO.all({
                        _id : {$in: filteredInspectionsForDate.map(inspection => inspection._id)}
                    });

                    await Promise.map(inspectionsToUpdate, async inspection => {
                        const oldInspectionDate = moment(inspection.InspectionDate);
                        const newInspectionDate = oldInspectionDate.clone().add(diffInDays, 'day');
                        inspection.InspectionDate = newInspectionDate.toISOString();
                        inspection.updated_at = moment().toISOString();
                        await inspection.save({validateBeforeSave: false}); // avoid updated_at changes
                        console.log(`moved inspection ${inspection._id} from ${oldInspectionDate.format('YYYY-MM-DD HH:mm')} to ${newInspectionDate.format('YYYY-MM-DD HH:mm')}`);
                    }, {concurrency: 5});

                    console.log(`migration finished`);
                }
            }
        }


        console.log(`done`);
    }
};

async function stats(startDayTime, endDayTime) {
    const inspectionsForDate = await InspectionDAO
        .all({
            InspectionDate: {$gte: startDayTime, $lte: endDayTime}
        })
        .populate({
            path: 'DeviceID',
            populate: {
                path: 'EquipmentType'
            }
        });

}

// npm run tool inspections-move-by-date 56fa30a9dfe0b75622682662 2019-12-11 2019-12-17
