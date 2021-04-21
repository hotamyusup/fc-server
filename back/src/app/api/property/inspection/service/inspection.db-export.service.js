const Promise = require("bluebird");
const moment = require("moment");
const _ = require("underscore");
const mongoose = require('mongoose');

const logger = require("../../../../core/logger");
const BaseDBExportService = require("../../../../core/base.db-export.service");

const InspectionDAO = require("../dao/inspection.dao");


class InspectionDbExportService extends BaseDBExportService {
    constructor() {
        super(InspectionDAO)
    }

    generate$LookupForRef($lookup, readFieldName = 'Title') {
        const pipeline = super.generate$LookupForRef($lookup, readFieldName);
        if ($lookup.as === 'Device') {
            const addFieldsRule = pipeline[pipeline.length - 1];
            addFieldsRule.$addFields['CurrentDeviceStatus'] = '$Device.Status';
        }

        return pipeline;
    }
}

module.exports = new InspectionDbExportService();
