const moment = require('moment-timezone');

const logger = require('./logger');

const NotificationService = require('../api/notification/service/notification.service');
const PropertyDAO = require('../api/property/property/dao/property.dao');
const InspectionDAO = require('../api/property/inspection/dao/inspection.dao');

class DailyEventsDispatcherService {
    constructor() {
        this.dailyEventsCache = {};
    }

    getTodayEventsCache() {
        const dateKey = moment().format('YYYY-MM-DD');
        if (!this.dailyEventsCache[dateKey]) {
            this.dailyEventsCache = {[dateKey]: {}};
        }

        return this.dailyEventsCache[dateKey];
    }

    async onInspectionAdded(inspection, user) {
        const cache = this.getTodayEventsCache();

        const inspectionID = `${inspection._id}`;
        const propertyID = `${inspection.PropertyID}`;

        if (!cache[propertyID]) {
            const inspectionsForToday = await InspectionDAO.forDate(undefined, {PropertyID: propertyID});

            if (inspectionsForToday.filter(i => `${i._id}` !== inspectionID).length === 0) {
                const property = await PropertyDAO.get(propertyID);
                // there weren't inspections today
                NotificationService.notifyUsersByType('Admin', {
                    title: `${property.Title} property inspections started!`,
                    body: `${user.Title} started property inspection at ${moment(inspection.created_at).tz("America/Los_Angeles").format(`DD MMM hh:mm a`)}`
                });
            }

            cache[propertyID] = true;
        }
    }
}

module.exports = new DailyEventsDispatcherService();

