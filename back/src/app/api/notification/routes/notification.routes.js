'use strict';

const NotificationController = require("../controller/notification.controller");

const NOTIFICATION_ROUTES = [
    {method: 'GET', path: '/notifications/stats', config: NotificationController.stats},
    {method: 'GET', path: '/notifications/{NotificationID}', config: NotificationController.get},
    {method: 'GET', path: '/notifications', config: NotificationController.all},
    {method: 'POST', path: '/notifications/readAll', config: NotificationController.markAllNotificationsAsRead},
    {method: 'POST', path: '/notifications/{NotificationID}/read', config: NotificationController.markNotificationAsRead},
    {method: 'POST', path: '/notifications/{NotificationID}', config: NotificationController.update},
    {method: 'POST', path: '/notifications', config: NotificationController.create},
];

module.exports = NOTIFICATION_ROUTES;
