'use strict';

const BaseController = require("../../../core/base.controller");
const NotificationEventDAO = require("../dao/notification-event.dao");

class NotificationEventController extends BaseController {
    constructor() {
        super(NotificationEventDAO);
        this.controllerName = 'NotificationEventController';
    }
}

module.exports = new NotificationEventController();
