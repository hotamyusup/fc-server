'use strict';
const Promise = require('bluebird');
const _ = require('lodash');

const BaseDAO = require("../../../core/base.dao");
const NotificationModel = require("../model/notification.model");


class NotificationDAO extends BaseDAO {
    constructor() {
        super(NotificationModel);
    }
}

module.exports = new NotificationDAO();
