'use strict';

const Promise = require('bluebird');
const request = require('request');
const _ = require('underscore');

const {db, Mongoose} = require('../../src/config/db');

const config = {
    prod : {
        host : 'fc2.fireprotected.com',
        port : 80,
        hash: '56f3a8d7927b976afff7ab9c'
    },
    dev : {
        host : 'dev.fc2.fireprotected.com',
        port : 80,
        hash: '56f3a8d7927b976afff7ab9c'
    },
    local : {
        host : 'localhost',
        port : 80,
        hash: '56f3a8d7927b976afff7ab9c'
    }
};
let configName = 'local';

const getFromURL = (urlPart, urlPropertiesPart) => {
    urlPropertiesPart = urlPropertiesPart || '';
    let currentConfig = config[configName];
    const url = `http://${currentConfig.host}:${currentConfig.port}/${urlPart}?hash=${currentConfig.hash}${urlPropertiesPart}`;
    // console.log('getFromURL === ', url);
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
let errEntitiesCounter = 0;
const moveEntityFromURL = (dao, urlPart, urlParams, mapResponse, customCreateEntity) => {
    console.log('moveEntityFromURL: ' + urlPart + '?---> ' + urlParams || '');
    mapResponse = mapResponse || (entitiesJSON => entitiesJSON);

    const createEntity = entityJSON => (customCreateEntity
        ? Promise.resolve(customCreateEntity(entityJSON))
        : dao.create(entityJSON))
        .then(res => {
            console.log(`saved ${++savedEntitiesCounter}: ${res._id} : ${urlPart}?---> ${urlParams}`);
            return res;
        }).catch(err => {
            err = err || {};
            if (11000 != err.code && 11001 != err.code) {
                throw err
            } else {
                console.log(`err ${++errEntitiesCounter}: ${urlPart}?---> ${urlParams} duplicate id ${entityJSON._id} error`);
                return null;
            }
        });

    const cleanupEntity = (entityJSON => {
        const fieldsToDelete = ['Buildings', 'Floors', 'Records', 'HasInspect', 'InspectCount'];
        if (urlPart !== 'equipments') {
            fieldsToDelete.push('Devices');
        }
        fieldsToDelete.forEach(field => delete entityJSON[field]);
        return entityJSON;
    });

    dao.model.collection.drop();
    return getFromURL(urlPart, urlParams)
        .then(entitiesJSON => Promise.map((mapResponse(entitiesJSON) || []), (entityJSON => createEntity(cleanupEntity(entityJSON)))));
};

const OrganizationDAO = require('../../src/app/api/organization/dao/organization.dao');
const EquipmentDAO = require('../../src/app/api/property/device/dao/equipment.dao');
const OccupancyTypeDAO = require('../../src/app/api/property/property/dao/occupancy-type.dao');
const ConstructionTypeDAO = require('../../src/app/api/property/property/dao/construction-type.dao');

const PropertyDAO = require('../../src/app/api/property/property/dao/property.dao');
const BuildingDAO = require('../../src/app/api/property/building/dao/building.dao');
const FloorDAO = require('../../src/app/api/property/floor/dao/floor.dao');
const DeviceDAO = require('../../src/app/api/property/device/dao/device.dao');
const InspectionDAO = require('../../src/app/api/property/inspection/dao/inspection.dao');

const MIGRATE_QUEUE = [
    [EquipmentDAO, 'equipments'],
    [ConstructionTypeDAO, 'constructiontypes'],
    [OccupancyTypeDAO, 'occupancytypes'],
    [OrganizationDAO, 'organizations'],
    [PropertyDAO, 'properties/processed', '&layer=Properties', ({Properties}) => Properties],
    [BuildingDAO, 'properties/processed', '&layer=Buildings', ({Buildings}) => Buildings],
    [FloorDAO, 'properties/processed', '&layer=Floors', ({Floors}) => Floors],
    [DeviceDAO, 'properties/processed', '&layer=Devices', ({Devices}) => Devices],
    [InspectionDAO, 'properties/processed', '&layer=Records', ({Records}) => Records],
];

const migrate = () => {
    console.time('Migrate data');
    Promise
        .map(MIGRATE_QUEUE, migrateEntityConfig => moveEntityFromURL.apply(null, migrateEntityConfig))
        .then(getUsers)
        .then(() => {
            console.log('\nMigration finished!\n');
            console.log(`saved: ${savedEntitiesCounter}, dupes: ${errEntitiesCounter}`);
        })
        .catch(error => {
            console.log(`error in migration : `, error);
        })
        .finally(()=> {
            console.timeEnd('Migrate data');
        });
};


module.exports = {
    run: (_configName) => {
        configName = _configName || configName;
        console.log('Run web migration - nested to flat tool. Config: ' + configName);
        db.once('open', migrate);
    }
};

