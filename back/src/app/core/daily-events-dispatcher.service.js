const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment-timezone');

const logger = require('./logger');

const NotificationService = require('../api/notification/service/notification.service');
const NotificationEventDAO = require('../api/notification/dao/notification-event.dao');
const UserDAO = require('../api/user/dao/user.dao');
const PropertyDAO = require('../api/property/property/dao/property.dao');
const BuildingDAO = require('../api/property/building/dao/building.dao');
const FloorDAO = require('../api/property/floor/dao/floor.dao');
const DeviceDAO = require('../api/property/device/dao/device.dao');
const EquipmentDAO = require("../api/property/device/dao/equipment.dao");
const InspectionDAO = require('../api/property/inspection/dao/inspection.dao');
const PropertyFlattenerService = require("../api/property/property/service/property.flattener.service");

const propertyDailyEventsNames = ['property-inspection:start', 'property-inspection:progress', 'property-inspection:finish'];

class DailyEventsDispatcherService {
    constructor() {
        this.getCache();
    }

    addEventToCache(notificationEvent, cache) {
        const eventName = notificationEvent.name;
        if (!cache[eventName]) {
            cache[eventName] = [];
        }

        cache[eventName].push(notificationEvent)

        const PropertyID = notificationEvent.data && notificationEvent.data.PropertyID;
        if (PropertyID) {
            if (!cache[PropertyID]) {
                cache[PropertyID] = {};
            }

            if (!cache[PropertyID][eventName]) {
                cache[PropertyID][eventName] = [];
            }
            cache[PropertyID][eventName].push(notificationEvent);
        }
    }

    async getCache() {
        const cachedDate = moment().tz("America/Los_Angeles").format('YYYY-MM-DD');

        if (this.cachedDate !== cachedDate) {
            this.cachedDate = cachedDate;
            this.dailyEventsCache = null;
        }

        if (!this.dailyEventsCache) {
            this.dailyEventsCache = new Promise(async resolve => {
                try {
                    const cache = {};
                    const getTodayEventsFired = await NotificationEventDAO.getByNamesForToday([...propertyDailyEventsNames]);
                    getTodayEventsFired.forEach(notificationEvent => this.addEventToCache(notificationEvent, cache));
                    resolve(cache);
                } catch (error) {
                    logger.error(`DailyEventsDispatcherService.getCache() error = ${error}`);
                    resolve({});
                }
            });
        }

        return this.dailyEventsCache;
    }

    async onInspectionsAdded(inspections, user) {
        return Promise.map(inspections, inspection => this.onInspectionAdded(inspection, user));
    }

    async onInspectionAdded(inspection, user) {
        if (!this.onInspectionAddedQueue) {
            this.onInspectionAddedQueue = [];
        }

        this.onInspectionAddedQueue.push({inspection, user});

        if (!this._onInspectionAddedProcess) {
            this._onInspectionAddedProcess = this._onInspectionAdded();
        }

        return this._onInspectionAddedProcess;
    }


    async _onInspectionAdded() {
        await Promise.delay(1000);

        const inspectionsQueue = this.onInspectionAddedQueue;

        this._onInspectionAddedProcess = undefined;
        this.onInspectionAddedQueue = undefined;

        const cache = await this.getCache();

        const property2inspections = _.groupBy(inspectionsQueue, ({inspection}) => `${inspection.PropertyID}`);

        async function getUserTitles(completeInspections) {
            const userId2completeInspectionCount = {};
            completeInspections.forEach(({User}) => {
                if (!userId2completeInspectionCount[User]) {
                    userId2completeInspectionCount[User] = 0;
                }
                userId2completeInspectionCount[User]++;
            });

            let users = await UserDAO.all({_id: {$in: _.keys(userId2completeInspectionCount)}});
            users = _.sortBy(users, user => -userId2completeInspectionCount[user._id]);
            const userTitles = users.map(user => user.Title).join(', ');

            return userTitles;
        }

        for (const PropertyID in property2inspections) {
            const propertyInspections = _.sortBy(property2inspections[PropertyID], 'InspectionDate');

            if (!cache[PropertyID]) {
                cache[PropertyID] = {};
            }

            const propertyCache = cache[PropertyID];

            if (propertyCache['property-inspection:finish']) {
                continue;
            } else {
                const {Properties} = await PropertyFlattenerService.getPropertiesFlatByIDs([PropertyID]);
                const property = Properties[0];

                if (property.HasInspect) {
                    if (!propertyCache['property-inspection:start']) {
                        const {inspection, user} = propertyInspections[0];

                        const inspectedAt = moment(inspection.InspectionDate).tz("America/Los_Angeles");
                        const notificationEvent = await NotificationEventDAO.create({
                            name: 'property-inspection:start',
                            recipients: {usersTypes: ['Admin']},
                            data: {
                                title: `${property.Title} inspection started!`,
                                body: `${user.Title} started inspection on ${inspectedAt.format(`DD MMM hh:mm a`)}.`,

                                PropertyID: `${inspection.PropertyID}`,
                                BuildingID: `${inspection.BuildingID}`,
                                FloorID: `${inspection.FloorID}`,
                                DeviceID: `${inspection.DeviceID}`,
                                InspectionID: `${inspection._id}`,
                            }
                        });

                        this.addEventToCache(notificationEvent, cache);
                    } else if (propertyCache['property-inspection:start']) {
                        // progress
                        const completedInspections = await InspectionDAO.getPropertyInspectionsForToday(PropertyID);
                        const completedInspectionsCount = completedInspections.length;
                        const totalInspectionsCount = (property.InspectCount || 0) + completedInspectionsCount;
                        const progress = parseInt((completedInspectionsCount * 100) / totalInspectionsCount);

                        const lastProgressEvent = _.max(propertyCache['property-inspection:progress'], event => event.created_at);
                        const lastProgress = parseInt((lastProgressEvent && lastProgressEvent.data && lastProgressEvent.data.progress) || 0);

                        const progressPoints = [30, 50, 80];

                        let lastProgressI = -1;
                        let currentProgressI = -1;

                        for (const [index, progressPoint] of progressPoints.entries()) {
                            if (progressPoint <= lastProgress) {
                                lastProgressI = index;
                            }
                            if (progressPoint <= progress) {
                                currentProgressI = index;
                            }
                        }

                        if (currentProgressI > lastProgressI) {
                            const {inspection, user} = propertyInspections[propertyInspections.length - 1];

                            const userTitles = await getUserTitles(completedInspections);
                            const inspectedAt = moment(inspection.InspectionDate).tz("America/Los_Angeles");

                            const completedInspectionsString = completedInspections.length === 1
                                ? `1 inspection was completed`
                                : `${completedInspections.length} inspections were completed`;

                            const notificationEvent = await NotificationEventDAO.create({
                                name: 'property-inspection:progress',
                                recipients: {usersTypes: ['Admin']},
                                data: {
                                    title: `${property.Title} inspection ${progress}% complete`,
                                    body: `${userTitles} completed ${progress}% of inspections on ${inspectedAt.format(`DD MMM hh:mm a`)}. ${completedInspectionsString}`,

                                    progress: `${progress}`,

                                    PropertyID: `${inspection.PropertyID}`,
                                    BuildingID: `${inspection.BuildingID}`,
                                    FloorID: `${inspection.FloorID}`,
                                    DeviceID: `${inspection.DeviceID}`,
                                    InspectionID: `${inspection._id}`,
                                }
                            });

                            this.addEventToCache(notificationEvent, cache);
                        }
                    }
                } else {
                    const {inspection, user} = propertyInspections[propertyInspections.length - 1];
                    const inspectedAt = moment(inspection.InspectionDate).tz("America/Los_Angeles");
                    const completedInspections = await InspectionDAO.getPropertyInspectionsForToday(PropertyID);

                    const userTitles = await getUserTitles(completedInspections);

                    const completedInspectionsString = completedInspections.length === 1
                        ? `1 inspection was completed`
                        : `${completedInspections.length} inspections were completed`;

                    const notificationEvent = await NotificationEventDAO.create({
                        name: 'property-inspection:finish',
                        recipients: {usersTypes: ['Admin']},
                        data: {
                            title: `${property.Title} inspection finished!`,
                            body: `${userTitles} finished the property inspection on ${inspectedAt.format(`DD MMM hh:mm a`)}. ${completedInspectionsString}`,

                            PropertyID: `${inspection.PropertyID}`,
                            BuildingID: `${inspection.BuildingID}`,
                            FloorID: `${inspection.FloorID}`,
                            DeviceID: `${inspection.DeviceID}`,
                            InspectionID: `${inspection._id}`,
                        }
                    });

                    this.addEventToCache(notificationEvent, cache);
                }
            }

            /* Each inspection notification */
            // for (const {inspection, user} of propertyInspections) {
            //     await this._processInspectionAdded(inspection, user);
            // }
        }
    }

    async _processInspectionAdded(inspection, user) {
        logger.info(`_processInspectionAdded() inspection ${JSON.stringify(inspection)} `)
        const {
            property,
            building,
            floor,
            device
        } = await Promise.props({
            property: PropertyDAO.get(inspection.PropertyID),
            building: BuildingDAO.get(inspection.BuildingID),
            floor: FloorDAO.get(inspection.FloorID),
            device: DeviceDAO.get(inspection.DeviceID),
        });

        const equipment = await EquipmentDAO.get(device.EquipmentType);
        const deviceType = equipment.Devices.id(device.DeviceType);

        const inspectionStatus = parseInt(inspection.DeviceStatus) === 0 ? 'Passed' : 'Failed';
        NotificationEventDAO.create({
            name: 'new-inspection',
            recipients: {usersTypes: ['Admin']},
            data: {
                title: `${property.Title} ${deviceType.Title} inspection ${inspectionStatus}!`,
                body: `${user.Title} inspected ${deviceType.Title} on ${moment(inspection.created_at).tz("America/Los_Angeles").format(`DD MMM hh:mm a`)}. Location:  ${property.Title} / ${building.Title} / ${floor.Title}`,

                PropertyID: `${inspection.PropertyID}`,
                BuildingID: `${inspection.BuildingID}`,
                FloorID: `${inspection.FloorID}`,
                DeviceID: `${inspection.DeviceID}`,
                InspectionID: `${inspection._id}`,
            }
        });
    }
}

module.exports = new DailyEventsDispatcherService();

