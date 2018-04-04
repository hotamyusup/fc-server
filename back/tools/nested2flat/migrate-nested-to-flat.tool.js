'use strict';

const Promise = require('bluebird');
const request = require('request');
const _ = require('underscore');

require('../../src/config/db');


//localhost/properties/processed?hash=56f3a8d7927b976afff7ab9c&DeviceID=5a959f272f342db6577a8860&layer=Devices
const getFromURL = (urlPart, urlPropertiesPart) => {
    urlPropertiesPart = urlPropertiesPart || '';
    // const url = `http://fc2.fireprotected.com/${urlPart}?hash=56f3a8d7927b976afff7ab9c${urlPropertiesPart}`;
    const url = `http://localhost/${urlPart}?hash=56f3a8d7927b976afff7ab9c${urlPropertiesPart}`;
    console.log('getFromURL === ', url);
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }
            resolve(JSON.parse(body));
        });
    });
};

const getUsers = () => {
    console.log('getUsers');
    const UserDAO = require('../../src/app/api/user/dao/user.dao');

    const getUserList = () => getFromURL('users');
    // we need to get user password, so use users/{userID} for getting full user info
    const getUserById = (userId) => getFromURL(`users/${userId}`);

    UserDAO.model.collection.drop();
    return getUserList()
        .then(users => Promise
            .map(users, user => getUserById(user._id).then(user => UserDAO.create(user)))
        );
};

let savedEntitiesCounter = 0;
const moveEntityFromURL = (dao, urlPart, urlParams, mapResponse, cleanupEntity, createEntity) => {
    console.log('moveEntityFromURL: ' + urlPart + ' ... ' + urlParams);
    // const EquipmentDAO = require('../../src/app/api/property/device/dao/equipment.dao');
    createEntity = createEntity || (entityJSON => dao.create(entityJSON).then(res => {
            console.log(`saved ${++savedEntitiesCounter}: ${res._id} : ${urlPart} ... ${urlParams}`);
            return res;
        }).catch(err => {
            err = err || {};
            if (11000 != err.code && 11001 != err.code) {
                throw err
            } else {
                console.log(`err: ${urlPart} ... ${urlParams} duplicate id ${entityJSON._id} error`)
            }
        }));

    mapResponse = mapResponse || (entitiesJSON => entitiesJSON);
    cleanupEntity = cleanupEntity || (entityJSON => {
            const fieldsToDelete = ['Buildings', 'Floors', 'Devices', 'Records', 'HasInspect', 'InspectCount'];
            fieldsToDelete.forEach(field => delete entityJSON[field]);
            return entityJSON;
        });

    dao.model.collection.drop();
    return getFromURL(urlPart, urlParams)
        .then(entitiesJSON => Promise.map(mapResponse(entitiesJSON) || [], entityJSON => createEntity(cleanupEntity(entityJSON))));
};


const EquipmentDAO = require('../../src/app/api/property/device/dao/equipment.dao');
const OrganizationDAO = require('../../src/app/api/organization/dao/organization.dao');

const PropertyDAO = require('../../src/app/api/property/property/dao/property.dao');
const BuildingDAO = require('../../src/app/api/property/building/dao/building.dao');
const FloorDAO = require('../../src/app/api/property/floor/dao/floor.dao');
const DeviceDAO = require('../../src/app/api/property/device/dao/device.dao');
const InspectionDAO = require('../../src/app/api/property/inspection/dao/inspection.dao');


const MIGRATE_QUEUE = [
    [EquipmentDAO, 'equipments'],
    [OrganizationDAO, 'organizations'],
    [PropertyDAO, 'properties/processed', '&layer=Properties', ({Properties}) => Properties],
    [BuildingDAO, 'properties/processed', '&layer=Buildings', ({Buildings}) => Buildings],
    [FloorDAO, 'properties/processed', '&layer=Floors', ({Floors}) => Floors],
    [DeviceDAO, 'properties/processed', '&layer=Devices', ({Devices}) => Devices],
    [InspectionDAO, 'properties/processed', '&layer=Records', ({Records}) => Records],
];


console.time('Migrate data');
Promise
    .map(MIGRATE_QUEUE, migrateEntityConfig => moveEntityFromURL.apply(null, migrateEntityConfig))
    .then(getUsers)
    .then(() => {
        console.log('\nMigration finished!\n')
        console.timeEnd('Migrate data');
    });


