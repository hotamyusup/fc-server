'use strict';

const NotificationEventController = require("../controller/notification-event.controller");
const NotificationToUserController = require("../controller/notification-to-user.controller");

const NOTIFICATION_ROUTES = [
    {method: 'GET', path: '/notifications/stats', config: NotificationToUserController.stats},
    {method: 'GET', path: '/notifications/{NotificationID}', config: NotificationToUserController.get},
    {method: 'GET', path: '/notifications', config: NotificationToUserController.all},
    {method: 'POST', path: '/notifications/readAll', config: NotificationToUserController.markAllNotificationsAsRead},
    {method: 'POST', path: '/notifications/{NotificationID}/read', config: NotificationToUserController.markNotificationAsRead},
    {method: 'POST', path: '/notifications', config: NotificationEventController.create},
];

module.exports = NOTIFICATION_ROUTES;
