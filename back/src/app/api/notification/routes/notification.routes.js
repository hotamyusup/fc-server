'use strict';

const NotificationController = require("../controller/notification.controller");

const NOTIFICATION_ROUTES = [
    {method: 'GET', path: '/notifications', config: NotificationController.all},
    {method: 'GET', path: '/notifications/{NotificationID}', config: NotificationController.get},
    {method: 'POST', path: '/notifications', config: NotificationController.create},
    {method: 'POST', path: '/notifications/{NotificationID}/read', config: NotificationController.markNotificationAsRead},
    {method: 'POST', path: '/notifications/{NotificationID}', config: NotificationController.update},
];

module.exports = NOTIFICATION_ROUTES;
