const Promise = require("bluebird");
const moment = require("moment");
const _ = require("underscore");
const mongoose = require('mongoose');

const logger = require("../../../../core/logger");
const BaseDBExportService = require("../../../../core/base.db-export.service");

const DeviceDAO = require("../dao/device.dao");
const EquipmentDAO = require("../dao/equipment.dao");


class DeviceDBExportService extends BaseDBExportService {
    constructor() {
        super(DeviceDAO)
    }

    async endSession(session) {
        await mongoose.connection.db.collection(this.getTempEquipmentDevicesTableName(session)).drop();
        await super.endSession(session);
    }

    async generateFieldsForRefs(session) {
        const superRefsPipeline = await super.generateFieldsForRefs(session);

        const temp_equipment_devices = this.getTempEquipmentDevicesTableName(session);

        const cursor = EquipmentDAO
            .aggregate([
                {
                    $unwind: '$Devices'
                },
                {
                    $project: {
                        _id: 0,
                        EquipmentTypeID: '$_id',
                        EquipmentTypeTitle: '$Title',
                        DeviceTypeID: '$Devices._id',
                        DeviceTypeTitle: '$Devices.Title'
                    }
                },
                {
                    $out: temp_equipment_devices
                }
            ])
            .allowDiskUse(true)
            .cursor({batchSize: 10000})
            .exec();

        await cursor.next();

        const deviceTypeTitle$lookup = [
            {
                $lookup: {
                    from: temp_equipment_devices,
                    foreignField: 'DeviceTypeID',
                    localField: 'DeviceType',
                    as: 'DeviceType_Title',
                }
            },
            {
                $addFields: {
                    DeviceType_Title: {
                        $filter: {
                            input: "$DeviceType_Title",
                            as: "item",
                            cond: {$eq: ['$$item.EquipmentTypeID', '$EquipmentType']}
                        }
                    }
                }
            },
            {
                $unwind: "$DeviceType_Title"
            },
            {
                $addFields: {
                    DeviceType_Title: '$DeviceType_Title.DeviceTypeTitle',
                }
            }
        ];

        return [
            ...superRefsPipeline,
            ...this.generate$LookupForRef({
                    from: 'equipment',
                    localField: 'EquipmentType',
                    as: 'EquipmentType_Title'
                }
            ),
            ...deviceTypeTitle$lookup,
        ];
    }

    getTempEquipmentDevicesTableName(session) {
        return `temp_export_csv_equipment_devices_${session.id}`;
    }
}

module.exports = new DeviceDBExportService();


/*

            // {
            //     $lookup: {
            //         from: temp_equipment_devices,
            //         let: {
            //             EquipmentTypeID: '$EquipmentType',
            //             DeviceTypeID: '$DeviceType'
            //         },
            //         pipeline: [
            //             {
            //                 $match: {
            //                     EquipmentTypeID: '$EquipmentType',
            //                     DeviceTypeID: '$DeviceType'
            //                 }
            //             }
            //         ],
            //         as: 'DeviceTypeTitle',
            //     }
            // },
            // {
            //     $lookup: {
            //         from: temp_equipment_devices,
            //         foreignField: 'DeviceTypeID',
            //         localField: 'DeviceType',
            //         as: 'DeviceTypeTitle',
            //     }
            // },
            // {
            //     $filter: {
            //         input: "$DeviceTypeTitle",
            //         as: "item",
            //         cond: {$eq: ['$$item.EquipmentID', '$EquipmentType']}
            //     }
            // }

            // ...this.generate$LookupForRef({
            //         foreignField: 'DeviceTypeID',
            //         from: temp_equipment_devices,
            //         localField: 'DeviceType',
            //         as: 'DeviceTypeTitle',
            //     },
            //     'DeviceTypeTitle'
            // ),
 */
