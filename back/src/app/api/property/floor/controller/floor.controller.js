'use strict';

const Promise = require('bluebird');

const BaseController = require("../../../../core/base.controller");
const logger = require("../../../../core/logger");

const FloorDAO = require("../dao/floor.dao");

class FloorController extends BaseController {
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
}

module.exports = new FloorController();