const Promise = require('bluebird');

const logger = require('../../src/app/core/logger');
const {db} = require('../../src/config/db');

const DeviceDAO = require('../../src/app/api/property/device/dao/device.dao');
const InspectionDAO = require('../../src/app/api/property/inspection/dao/inspection.dao');


module.exports = {
    run: async () => {
        logger.info(`Inspections fix script started`);

        await (new Promise(resolve => db.once('open', resolve)));

        const inspections = await InspectionDAO.all({}, {}, '_id DeviceID FloorID BuildingID');
        const devices = await DeviceDAO.all({}, {}, '_id FloorID BuildingID');

        const id2device = {};
        devices.forEach(device => id2device[device._id] = device);

        logger.info(`Looking for corrupted Inspections entities`);

        const updateQueue = [];
        const corruptedInspections = inspections.filter(inspection => {
            const device = id2device[inspection.DeviceID];
            if (device) {
                if ((`${device.BuildingID}` !== `${inspection.BuildingID}`) || `${device.FloorID}` !== `${inspection.FloorID}`) {

                    updateQueue.push(InspectionDAO.update({
                            _id: inspection._id,
                            BuildingID: device.BuildingID,
                            FloorID: device.FloorID,
                    }));

                    return true;
                }
            } else {
                logger.info(`Warning! Inspection ${inspection._id} have link to unknown Device with DeviceID = ${inspection.DeviceID}`);
            }
        });

        logger.info(`corruptedInspections[${corruptedInspections.length}] === ${JSON.stringify(corruptedInspections)}`.slice(0, 900));

        await Promise.all(updateQueue);

        logger.info(`\n`);
        logger.info(`update finished, updated ${updateQueue.length}`);
    }
};
