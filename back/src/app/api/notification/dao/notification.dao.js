'use strict';
const Promise = require('bluebird');
const _ = require('lodash');

const BaseDAO = require("../../../core/base.dao");
const NotificationModel = require("../model/notification.model");


class NotificationDAO extends BaseDAO {
    constructor() {
        super(NotificationModel);
    }

    async markAllRead(userID) {
        return NotificationModel.updateMany({User: userID, Read: false}, {$set: {Read: true}});
    }

}

module.exports = new NotificationDAO();
