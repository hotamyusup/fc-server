const Promise = require('bluebird');
const request = require('request');
const _ = require('underscore');

const {db, onDBConnected} = require('../../src/config/db');

const config = {
    prod: {
        host: 'fc3.fireprotected.com',
        port: 80,
        hash: '5a3d734d4d05b872e7af836b'
    },
    dev: {
        host: 'dev.fc2.fireprotected.com',
        port: 9999,
        hash: '57075bf139d1bffb8981e438'
    },
    local: {
        host: 'localhost',
        port: 80,
        hash: '56f3a8d7927b976afff7ab9c'
    }
};

let configName = 'prod';

const getFromURL = async (urlPart, urlPropertiesPart = '') => {
    const currentConfig = config[configName];
    const url = `http://${currentConfig.host}:${currentConfig.port}/${urlPart}?hash=${currentConfig.hash}${urlPropertiesPart}`;

    console.log(`getFromURL() url ${url}`);

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

const moveEntityFromURLByProperty = async (dao, urlPart) => {
    const properties = await PropertyDAO.all();

    for (const property of properties) {
        await moveEntityFromURL(dao, urlPart, `&PropertyID=${property._id}`);
    }
}

const moveEntityFromURLPaged = async (dao, urlPart, limit = 50000) => {
    let offset = 0;
    let savedCount = 0;
    do {
        const saved = await moveEntityFromURL(dao, urlPart, `&limit=${limit}&skip=${offset}`);
        savedCount = saved.length;
        offset = offset + limit;
    } while (savedCount !== 0)
}

let savedEntitiesCounter = 0;
let errEntitiesCounter = 0;

const moveEntityFromURL = async (dao, urlPart, urlParams) => {
    console.log('moveEntityFromURL: ' + urlPart);

    const prepareEntity = entityJSON => {
        if (urlPart === 'users') {
            entityJSON.Password = '1111'
        }

        return entityJSON;
    }

    const createEntity = entityJSON => dao
        .upsert(prepareEntity(entityJSON))
        .then(res => {
            savedEntitiesCounter++;
            // console.log(`saved ${savedEntitiesCounter}: ${res._id} : ${urlPart}`);
            return res;
        }).catch(err => {
            err = err || {};
            if (11000 != err.code && 11001 != err.code) {
                throw err
            } else {
                console.log(`err ${++errEntitiesCounter}: ${urlPart} duplicate id ${entityJSON._id} error`);
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


    const entitiesJSON = await getFromURL(urlPart, urlParams) || [];

    console.log(`got ${entitiesJSON.length} entities from ${urlPart}`);

    const saved = await Promise.map(
        entitiesJSON,
        (entityJSON => createEntity(cleanupEntity(entityJSON)))
    );
    
    console.log(`${urlPart} saved:${saved.length}`);

    return saved;
};

const UserDAO = require('../../src/app/api/user/dao/user.dao');

const OrganizationDAO = require('../../src/app/api/organization/dao/organization.dao');
const EquipmentDAO = require('../../src/app/api/property/device/dao/equipment.dao');
const OccupancyTypeDAO = require('../../src/app/api/property/property/dao/occupancy-type.dao');
const ConstructionTypeDAO = require('../../src/app/api/property/property/dao/construction-type.dao');

const PropertyDAO = require('../../src/app/api/property/property/dao/property.dao');
const BuildingDAO = require('../../src/app/api/property/building/dao/building.dao');
const FloorDAO = require('../../src/app/api/property/floor/dao/floor.dao');
const DeviceDAO = require('../../src/app/api/property/device/dao/device.dao');
const InspectionDAO = require('../../src/app/api/property/inspection/dao/inspection.dao');


const migrate = async () => {
    console.time('Migrate data');
    try {
        await Promise.map([
                // [UserDAO, 'users'],
                // [EquipmentDAO, 'equipments'],
                // [ConstructionTypeDAO, 'constructiontypes'],
                // [OccupancyTypeDAO, 'occupancytypes'],
                // [OrganizationDAO, 'organizations'],
                // [PropertyDAO, 'properties'],
                // [BuildingDAO, 'buildings'],
                // [FloorDAO, 'floors'],
                [DeviceDAO, 'devices'],
                [InspectionDAO, 'inspections'],
            ],
            async config => {
                try {
                    const dao = config[0];
                    await dao.model.collection.drop();
                } catch (e) {
                    console.log('cant remove collection');
                }

                return moveEntityFromURLPaged(...config);
            }
        );

        console.log('\nMigration finished!\n');
        console.log(`saved: ${savedEntitiesCounter}, dupes: ${errEntitiesCounter}`);

    } catch (error) {
        console.log(`error in migration : `, error);
    } finally {
        console.timeEnd('Migrate data');
    }
};

module.exports = {
    run: async (_configName) => {
        configName = _configName || configName;
        console.log('Run web migration - fetch-db tool. Config: ' + configName);
        await onDBConnected;
        await migrate();
    }
};

