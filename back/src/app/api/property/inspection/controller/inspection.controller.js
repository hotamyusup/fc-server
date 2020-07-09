'use strict';

const Promise = require('bluebird');
const _ = require('underscore');

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

    on_create(request, createdInspection) {
        const currentUser = this.getCurrentUser(request);
        if (!createdInspection || !currentUser) {
            logger.error(`${this.controllerName}.on_create(createdInspection not null = ${!!createdInspection}, currentUser not null = ${!!currentUser}) error, not all params are provided`);
            return;
        }

        DailyEventsDispatcherService.onInspectionAdded(createdInspection, currentUser);
    }

    on_upsert(request, upsertedInspection) {
        const currentUser = this.getCurrentUser(request);
        if (!upsertedInspection || !currentUser) {
            logger.error(`${this.controllerName}.on_upsert(upsertedInspection not null = ${!!upsertedInspection}, currentUser not null = ${!!currentUser}) error, not all params are provided`);
            return;
        }

        DailyEventsDispatcherService.onInspectionAdded(upsertedInspection, currentUser);
    }

    on_batch(request, upsertedInspections) {
        logger.info(`${this.controllerName}.on_batch(upsertedInspection  = ${!!upsertedInspections})`)
        const currentUser = this.getCurrentUser(request);
        if (!upsertedInspections || !currentUser) {
            logger.error(`${this.controllerName}.on_batch(upsertedInspection not null = ${!!upsertedInspections}, currentUser not null = ${!!currentUser}) error, not all params are provided`);
            return;
        }

        if (request.ctx && request.ctx.batch && request.ctx.batch.new) {
            const new2id = {};
            request.ctx.batch.new.forEach( entityId => new2id[`${entityId}`] = entityId);

            const newInspections = _.filter(upsertedInspections, inspection => new2id[inspection._id]);
            DailyEventsDispatcherService.onInspectionsAdded(newInspections, currentUser);
        }

    }
}

module.exports = new InspectionController();
