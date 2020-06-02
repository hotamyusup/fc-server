'use strict';
const NotificationService = require('../../src/app/api/notification/service/notification.service');

const Promise = require('bluebird');
const _ = require('underscore');

const {
    onDBConnected
} = require('../../src/config/db');


module.exports = {
    run: async () => {
        await onDBConnected;
        await NotificationService.notify("57075bf139d1bffb8981e438", {
            title: 'Hey from tool!!!',
            body: "tool notification v1"
        });

        process.exit(0);
    }
};

