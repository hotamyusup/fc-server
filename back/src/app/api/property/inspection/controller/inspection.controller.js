'use strict';

const Promise = require('bluebird');

const PropertyChildrenBaseController = require("../../common/property.children.base.controller");
const logger = require("../../../../core/logger");

const DailyEventsDispatcherService = require('../../../../core/daily-events-dispatcher.service')
const InspectionDAO = require("../dao/inspection.dao");

class InspectionController extends PropertyChildrenBaseController {
    constructor() {
        super(InspectionDAO);
        this.controllerName = 'InspectionController';
        this.requestIDKey = 'InspectionID';
        this.batchEntitiesKey = 'inspections';
    }

    onCreate(createdInspection, currentUser) {
        if (!createdInspection || !currentUser) {
            logger.error(`${this.controllerName}.onCreate(createdInspection not null = ${!!createdInspection}, currentUser not null = ${!!currentUser}) error, not all params are provided`);
            return;
        }

        DailyEventsDispatcherService.onInspectionAdded(createdInspection, currentUser);
    }

    onUpdate(updatedInspection, currentUser) {
        if (!updatedInspection || !currentUser) {
            logger.error(`${this.controllerName}.onUpdate(updatedInspection not null = ${!!updatedInspection}, currentUser not null = ${!!currentUser}) error, not all params are provided`);
            return;
        }
    }

    onUpsert(upsertedInspection, currentUser) {
        if (!upsertedInspection || !currentUser) {
            logger.error(`${this.controllerName}.onUpsert(upsertedInspection not null = ${!!upsertedInspection}, currentUser not null = ${!!currentUser}) error, not all params are provided`);
            return;
        }

        DailyEventsDispatcherService.onInspectionAdded(upsertedInspection, currentUser);
    }
}

module.exports = new InspectionController();
