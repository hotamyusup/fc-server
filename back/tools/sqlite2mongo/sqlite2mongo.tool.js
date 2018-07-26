'use strict';

const Promise = require('bluebird');
const moment = require('moment');
const sqlite = require('sqlite');
const path = require('path');
const _ = require('underscore');
const request = require('request');

const config = {
    prod: {
        host: 'firecloud3.fireprotected.comxxxx',
        port: 80,
        hash: '56f3a8d7927b976afff7ab9c'
    },
    dev: {
        host: 'dev.fc2.fireprotected.com',
        port: 9999,
        hash: '57075bf139d1bffb8981e438'
    },
    local: {
        host: 'localhost',
        port: 1111,
        hash: '56f3a8d7927b976afff7ab9c'
    }
};
let configName = 'local';

module.exports = {
    run: async(_configName, dateFrom, databaseFileName = 'database.sqlite') => {
        configName = _configName || configName;
        if (!_configName || !dateFrom) {
            console.log(`plz enter all params. Example: npm run tool sqlite2mongo local 2018-07-20 database.sqlite`);
            return;
        }
        console.log(`Run sqlite[${databaseFileName} to server export tool. Config: ${configName}, date from = ${dateFrom}`);
        const dbPromise = sqlite.open(path.normalize(__dirname + `./${databaseFileName}`), {Promise});
        const db = await dbPromise;

        const logEntities = (logString, tableName, entities) => {
            console.log(`${logString} ${tableName} == `, entities.length);
            return entities;
        };
        const getSQLiteEntitiesAfterDate = (tableName, date) => {
            return db.all(`
                            SELECT *
                            FROM ${tableName}
                            WHERE updated_at > '${date}'
                            ORDER BY updated_at DESC;
                        `)
                .then(entities => logEntities('got SQLite entities from ', tableName, entities));
        };

        const getServerEntitiesAfterDate = (tableName, date) => {
            return getFromURL(tableName, date && `&from=${date}`)
                .then(entities => logEntities(`got entities from ${configName}`, tableName, entities));
        };

        const tableNames = ['properties', 'buildings', 'floors', 'devices', 'inspections'];

        const [sqliteEntitiesFromDate, serverEntitiesFromDate] = await Promise.all([
            Promise.map(tableNames, tableName => getSQLiteEntitiesAfterDate(tableName, dateFrom)),
            Promise.map(tableNames, tableName => getServerEntitiesAfterDate(tableName, dateFrom))
        ]);

        const entitiesToPost = {};

        const ignoreEntityFields = ['updated_at', 'uri', 'id'];
        const compareMessagesSet = {};
        const compareAllFieldsFromObjects = (tableName, sqliteEntity, serverEntity) => {
            let message;
            let changedFields = [];
            if (!serverEntity) {
                message = `[DIFFERENT][NEW] new entity ${tableName}, not found server copy`;
                changedFields = ['new case'];
            } else if (sqliteEntity.updated_at < serverEntity.updated_at) {
                message = `[DIFFERENT][OLD] your version of ${tableName} entity is older then server version`;
            } else if (sqliteEntity.updated_at > serverEntity.updated_at) {
                changedFields = Object.keys(sqliteEntity).filter(field => {
                    if (ignoreEntityFields.indexOf(field) === -1 && field.substr(field.length - 4) !== "JSON") {
                        return sqliteEntity[field] != serverEntity[field]
                    }
                    return false;
                });

                // if (sqliteEntity.Status === 1 && serverEntity.Status === 2) {
                //     console.log('sqliteEntity === ', sqliteEntity);
                // }

                if (changedFields.length) {
                    message = `[DIFFERENT] changed entity ${tableName}, changed fields: ${changedFields.map(field => `${field} ${sqliteEntity[field]} !== ${serverEntity[field]}`).join(',')}`;
                    // console.log(message);
                } else {
                    message = `[EQUAL] changed entity ${tableName} same fields`;
                    // console.log(message);
                }
            }

            if (message) {
                compareMessagesSet[message] = compareMessagesSet[message] || 0;
                compareMessagesSet[message]++;
            }

            return changedFields.length;
        };

        tableNames.forEach((tableName, i) => {
            const serverEntitiesForTable = serverEntitiesFromDate[i];
            const serverEntitiesForTableById = _.indexBy(serverEntitiesForTable, '_id');

            const sqliteEntitiesForTable = sqliteEntitiesFromDate[i] || [];

            entitiesToPost[tableName] = sqliteEntitiesForTable.filter(sqliteEntity => {
                const serverEntity = serverEntitiesForTableById[sqliteEntity._id];
                const notUpdatedOnServerFromDate = !serverEntity;
                return notUpdatedOnServerFromDate || compareAllFieldsFromObjects(tableName, sqliteEntity, serverEntity);
            });
        });

        console.log(`filtering with entities updated from same dates completed`);
        // compare filtered sql entities directly with server, by id
        await Promise.map(tableNames, tableName => {
            console.log(`${entitiesToPost[tableName].length} changed entities for ${tableName} `);

            return Promise
                .map(entitiesToPost[tableName],
                    entity => getFromURL(`${tableName}/${entity._id}`).then(serverEntity => compareAllFieldsFromObjects(tableName, entity, serverEntity) ? entity : null),
                    {concurrency: 2000})
                .filter(entity => !!entity)
                .then(filtered => {
                    entitiesToPost[tableName] = filtered.map(entity => {

                        // hack for devices with corrupted InstallationDate
                        if (entity.InstallationDate === 'Invalid date') {
                            if (entity.created_at || entity.updated_at) {
                                entity.InstallationDate = moment(entity.created_at || entity.updated_at).toISOString();
                            }
                        }

                        return entity;
                    });
                    console.log(`${filtered.length} changed entities for ${tableName} `);
                });
        });

        console.log(`\nfilter finished`);
        console.log('\ncomparision stats:\n', compareMessagesSet);

        console.log(`\nGoing to update: `);
        tableNames.forEach(tableName => {
            console.log(` - ${(tableName + ' . . . . . . . .').substr(0, 10)} . . . . . . . ${entitiesToPost[tableName].length}`);
        });

        await Promise.map(tableNames, tableName => {
            console.log(`POSTING ${tableName}/batch entities = [:${entitiesToPost[tableName].length}]`);
            return postEntitiesBatch(tableName, entitiesToPost[tableName]).catch(error => {
                console.log(`[ERROR] POST ${tableName}/batch failed`, error);
                throw  error;
            });
        });
        console.log(`Everything successfully updated!`);
        console.log(`FINISH`);
    }
};

const getFromURL = (urlPart, urlPropertiesPart, counter = 0) => {
    urlPropertiesPart = urlPropertiesPart || '';
    counter++;
    let currentConfig = config[configName];
    const url = `http://${currentConfig.host}:${currentConfig.port}/${urlPart}?hash=${currentConfig.hash}${urlPropertiesPart}`;
    // console.log('getFromURL === ', url);
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) {
                if (counter < 10) {
                    console.log(`getFromURL(${urlPart}, ${urlPropertiesPart}, ${counter}) error, err.code = ${err.code} ---- one more call`);
                    getFromURL(urlPart, urlPropertiesPart, counter).then(resolve).catch(reject);
                } else {
                    console.log(`getFromURL(${urlPart}, ${urlPropertiesPart}, ${counter}) error, err.code = ${err.code}\n`, err);
                    reject(err);
                }
                return;
            }
            try {
                if (counter > 1) {
                    console.log(`getFromURL(${urlPart}, ${urlPropertiesPart}, ${counter}) resolved()`);
                }
                resolve(JSON.parse(body));
            } catch (e) {
                resolve();
            }
        });
    });
};

const postEntitiesBatch = (tableName, entities) => {
    const currentConfig = config[configName];
    const url = `http://${currentConfig.host}:${currentConfig.port}/${tableName}/batch?hash=${currentConfig.hash}`;
    const chunkedEntities = chunk(entities, 20000);

    return Promise.map(chunkedEntities, entities => {
        const json = {};
        json[tableName] = entities;

        return new Promise((resolve, reject) => {
            console.log(`POST ${url} : object {${Object.keys(json)[0]}: [:${entities.length}]}`);
            request.post({url, json}, (err, res, body) => {
                if (err) {
                    console.log(`postEntitiesBatch(${tableName}) error: `, err);
                    reject(err);
                    return;
                }
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve();
                }
            })
        });
    });
};

function chunk(array, size) {
    const chunks = [];
    let i = 0;
    while (i < array.length) {
        chunks.push(array.slice(i, i += size));
    }
    return chunks;
}
