'use strict';

const _ = require('underscore');
const moment = require('moment');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const Boom = require('boom');
const {parseAsync} = require('json2csv');

const BaseController = require('../../../core/base.controller');
const PropertyDAO = require('../property/dao/property.dao');
const BuildingDAO = require('../building/dao/building.dao');
const FloorDAO = require('../floor/dao/floor.dao');
const DeviceDAO = require('../device/dao/device.dao');

const UserDAO = require('../../user/dao/user.dao');
const EquipmentDAO = require('../device/dao/equipment.dao');

class PropertyChildrenBaseController extends BaseController {

    get get() {
        return {
            handler: async (request, reply) => {
                const entity = await this.DAO.get(request.params[this.requestIDKey]);
                const user = request.auth && request.auth.credentials;

                if (user.Type === 'Customer') {
                    const usersPropertiesList = await PropertyDAO.getPropertiesForOrganization(user.Organization);
                    const property = _.filter(usersPropertiesList, property => `${property.id}` === `${entity.PropertyID}`)[0];

                    if (!property) {
                        return reply(Boom.forbidden(`User ${user && user.Title} dont have access to entity`));
                    }
                }

                return this.handle('get', request, reply, entity)
            }
        };
    }

    get all() {
        return {
            handler: async (request, reply) => {
                const {from, sort, limit, skip, filter, fields, DeviceID, FloorID, BuildingID, PropertyID} = request.query;

                const options = {
                    sort: sort ? JSON.parse(decodeURIComponent(sort)) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                    skip: skip ? parseInt(skip) : undefined
                };

                const conditions = filter ? JSON.parse(decodeURIComponent(filter)) : {};
                if (from) {
                    conditions.updated_at = {
                        $gt: moment(from).toDate()
                    }
                }

                _.pairs(conditions).forEach(([field, value]) => {
                    if (value != null && value != '') {
                        if (value.$regex) {
                            const $regex = new RegExp(value.$regex, "i");
                            value.$regex = $regex
                        }

                        if (this.DAO.fieldDefinition(field).instance === 'Date') {
                            if (typeof value === 'object') {
                                ['$gte', '$gt', '$lte', '$lt'].forEach(comparatorField => {
                                    if (value[comparatorField]) {
                                        value[comparatorField] = moment(value[comparatorField]).toDate();
                                    }
                                })
                            } else {
                                conditions[field] = moment(value).toDate();
                            }
                        }
                    } else {
                        delete conditions[field];
                    }
                });

                ['DeviceID', 'FloorID', 'BuildingID', 'PropertyID'].forEach(key => {
                    if (request.query[key]) {
                        conditions[key] = request.query[key];
                    }
                });

                const user = request.auth && request.auth.credentials;
                await this.addConditionFilterUserOwnEntities(conditions, user);
                
                let fieldsObj;
                if (fields) {
                    const parsedFields = decodeURIComponent(fields).split(',')
                    fieldsObj = {};
                    for (const name of parsedFields) {
                        fieldsObj[name] = 1;
                    }
                }
                const entities = await this.DAO.all(conditions, options, fieldsObj);
                return this.handle('all', request, reply, entities);
            },
            timeout: {
                server: 5 * 60 * 1000,
                socket: 5 * 60 * 1000 + 5000 // Socket timeout should be more than Server timeout
            }
        };
    }

    async addConditionFilterUserOwnEntities(conditions, user) {
        if (user.Type === 'Customer') {
            const usersPropertiesList = await PropertyDAO.getPropertiesForOrganization(user.Organization);
            conditions.PropertyID = {$in: _.map(usersPropertiesList, prop => prop._id)};
        }
    }


    // @deprecated
    async parseCSV(result) {
        if (!_.isArray(result)) {
            result = [result];
        }

        const fieldsMap = {};
        _.forEach(result, entity => {
            if (entity.schema) {
                entity.schema.eachPath(field => fieldsMap[field] = field);
            } else {
                Object.keys(entity).map(field => fieldsMap[field] = field);
            }
        });

        const isObjectId = objectIdCandidate => objectIdCandidate && mongoose.Types.ObjectId.isValid(objectIdCandidate);
        const id2model = {};
        const getFromCache = async (id, dao) => {
            if (!id2model[id]) {
                id2model[id] = dao.get(id);
            }
            return id2model[id];
        };

        let equipments;
        let id2equipment = {};
        const getEquipmentOrDeviceTypeById = async id => {
            if (equipments) {
                equipments = await equipments;
            } else {
                equipments = EquipmentDAO.all();
                equipments = await equipments;
                _.forEach(equipments, equipment => {
                    id2equipment[equipment._id] = equipment;
                    _.forEach(equipment.Devices, deviceType => id2equipment[deviceType._id] = deviceType);
                });
            }

            return id2equipment[id];
        };

        const extendFields = {
            User: {
                async extendEntity(entity) {
                    if (entity.User) {
                        entity.UserID = entity.User;
                        const user = await getFromCache(entity.UserID, UserDAO);
                        entity.User = user && user.Title;
                    }
                    return entity;
                },
                addFields: ['UserID']
            },
            EquipmentType: {
                async extendEntity(entity) {
                    if (entity.EquipmentType) {
                        entity.EquipmentTypeID = entity.EquipmentType;
                        const equipmentType = await getEquipmentOrDeviceTypeById(entity.EquipmentTypeID);
                        entity.EquipmentType = equipmentType && equipmentType.Title;
                    }
                    return entity;
                },
                addFields: ['EquipmentTypeID']
            },
            DeviceType: {
                async extendEntity(entity) {
                    if (entity.DeviceType) {
                        entity.DeviceTypeID = entity.DeviceType;
                        const deviceType = await getEquipmentOrDeviceTypeById(entity.DeviceTypeID);
                        entity.DeviceType = deviceType && deviceType.Title;
                    }
                    return entity;
                },
                addFields: ['DeviceTypeID']
            },
            PropertyID: {
                async extendEntity(entity) {
                    if (entity.PropertyID) {
                        const property = await getFromCache(entity.PropertyID, PropertyDAO);
                        entity.Property = property && property.Title;
                    }
                    return entity;
                },
                addFields: ['Property']
            },
            BuildingID: {
                async extendEntity(entity) {
                    if (entity.BuildingID) {
                        const building = await getFromCache(entity.BuildingID, BuildingDAO);
                        entity.Building = building && building.Title;
                    }
                    return entity;
                },
                addFields: ['Building']
            },
            FloorID: {
                async extendEntity(entity) {
                    if (entity.FloorID) {
                        const floor = await getFromCache(entity.FloorID, FloorDAO);
                        entity.Floor = floor && floor.Title;
                    }
                    return entity;
                },
                addFields: ['Floor']
            },
            DeviceID: {
                async extendEntity(entity) {
                    if (entity.DeviceID) {
                        const device = await getFromCache(entity.DeviceID, DeviceDAO);
                        entity.Device = device && device.Title;
                    }
                    return entity;
                },
                addFields: ['Device']
            }
        };

        async function extendEntity(entity) {
            if (entity.toObject) {
                entity = entity.toObject();
            }

            const fields = Object.keys(extendFields);
            for (let fieldName of fields) {
                await extendFields[fieldName].extendEntity(entity);
            }

            if (_.isArray(entity.Buildings)) {
                delete entity.Buildings;
            }

            return entity;
        }

        Object.keys(fieldsMap).map(fieldName => {
            const extendField = extendFields[fieldName];
            if (extendField) {
                extendField.addFields.forEach(addField => {
                    if (!fieldsMap[addField]) {
                        fieldsMap[addField] = addField;
                    }
                });
            }
        });

        const extendedEntities = await Promise.map(result, extendEntity, {concurrency: 1000});

        const opts = {fields: Object.keys(fieldsMap)};
        const csv = await parseAsync(extendedEntities, opts);

        return csv;
    }
}

module.exports = PropertyChildrenBaseController;
