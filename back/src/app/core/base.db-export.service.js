const Promise = require('bluebird');
const moment = require('moment');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const exec = Promise.promisify(require('child_process').exec);
const uuid = require('node-uuid');

const config = require('../../config/config');

const tempCSVFileFolderPath = path.normalize(__dirname + '/../api/file/public/file/export-csv');
fs.mkdir(tempCSVFileFolderPath, e => e);

class BaseDBExportService {
    constructor(dao) {
        this.collectionName = dao.collectionName;
        this.DAO = dao;
    }

    async export($match, pipeline = []) {
        const session = await this.startSession();
        console.log('session === ', session);
        console.log('$match === ', $match);

        const timerName = `BaseDBExportService:${session.id}`;
        console.time(timerName);

        console.time(`BaseDBExportService:${session.id}.aggregateToTempCollection`);
        await this.aggregateToTempCollection(session, $match, session.tempCollectionName, pipeline);
        console.timeEnd(`BaseDBExportService:${session.id}.aggregateToTempCollection`);

        console.time(`BaseDBExportService:${session.id}.mongoexport`);
        const outFilePath = await this.mongoexport(session);
        console.timeEnd(`BaseDBExportService:${session.id}.mongoexport`);

        await this.endSession(session);
        console.timeEnd(timerName);

        return outFilePath;
    }

    async startSession() {
        const time = moment().toISOString();
        const id = uuid.v4();
        const name = `${this.collectionName}_export-${time}-${id}`.replace(/\W/g, '_');
        const tempCollectionName = `temp_export_csv_${name}`;
        const session = {id, time, name, tempCollectionName};

        return session
    }

    async endSession(session) {
        await mongoose.connection.db.collection(session.tempCollectionName).drop();
        console.log(`end session`);
    }

    async aggregateToTempCollection(session, $match, $out = 'temp_export_collection', pipeline = []) {
        const generateFieldsForRefs = await this.generateFieldsForRefs(session);

        const cursor = this.DAO
            .aggregate([
                {$match},
                // {$limit: 10000},
                ...generateFieldsForRefs,
                ...pipeline,
                // ...(modelRefs.reduce(($lookups, $lookup) => [...$lookups, ...this.generate$LookupForRef($lookup)], [])),
                {$out}
            ])
            .allowDiskUse(true)
            .cursor({batchSize: 1000})
            .exec();

        await cursor.next();
    }

    async getFields(session) {
        const result = await mongoose.connection.db
            .collection(session.tempCollectionName)
            .aggregate([
                {
                    $project: {"arrayofkeyvalue": {$objectToArray: "$$ROOT"}}
                },
                {
                    $unwind: "$arrayofkeyvalue"
                },
                {
                    $group: {"_id": null, "fieldNames": {$addToSet: "$arrayofkeyvalue.k"}}
                }
            ])
            .toArray();

        return result && result[0] && result[0]['fieldNames'] || ['_id'];
    }

    async mongoexport(session) {
        const fields = await this.getFields(session);
        const outFilePath = `${path.normalize(`${tempCSVFileFolderPath}/${session.name}`)}.csv`;

        const mongoexportCommand = `mongoexport \
        --uri ${config.database.url} \
        --collection ${session.tempCollectionName} \
        --fields=${fields.join(',')} \
        --type=csv \
        --out "${outFilePath}"`;

        await exec(mongoexportCommand);

        return outFilePath;
    }

    async generateFieldsForRefs(session) {
        return [
            ...this.generate$LookupForRef({
                    from: "properties",
                    localField: "PropertyID",
                    as: "Property"
                }
            ),
            ...this.generate$LookupForRef({
                from: "buildings",
                localField: "BuildingID",
                as: "Building"
            }),
            ...this.generate$LookupForRef({
                from: "floors",
                localField: "FloorID",
                as: "Floor"
            }),
            ...this.generate$LookupForRef({
                from: "devices",
                localField: "DeviceID",
                as: "Device"
            }),
            ...this.generate$LookupForRef({
                    from: "users",
                    localField: "UserID",
                    as: "User"
                }
            ),
        ]
    }

    generate$LookupForRef($lookup, readFieldName = 'Title') {
        const fieldName = `${$lookup.as}`;
        const fieldRef = `$${fieldName}`;

        return this.DAO.fieldExists($lookup.localField)
            ? [
                {
                    $lookup: {
                        foreignField: '_id',
                        ...$lookup
                    }
                },
                {
                    $unwind: fieldRef
                },
                {
                    $addFields: {
                        [fieldName]: `${fieldRef}.${readFieldName}`,
                    }
                }
            ]
            : []

    }


}

module.exports = BaseDBExportService;
