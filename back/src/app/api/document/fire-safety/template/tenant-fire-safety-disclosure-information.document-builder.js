'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const http = require('http');
const fs = require('fs');
const Boom = require('boom');
const Canvas = require('canvas-prebuilt');
const path = require('path');
const logger = require('../../../../core/logger');

const EquipmentDAO = require("../../../property/device/dao/equipment.dao");
const InspectionDAO = require("../../../property/inspection/dao/inspection.dao");
const DeviceDAO = require("../../../property/device/dao/device.dao");
const FloorDAO = require("../../../property/floor/dao/floor.dao");
const BuildingDAO = require("../../../property/building/dao/building.dao");
const PropertyDAO = require("../../../property/property/dao/property.dao");

const iconsBase64 = require('./base64.icons');
const styles = require('./pdfmake.styles');

const toStringDateFormat = "MMMM DD, YYYY";

class TenantFireSafetyDisclosureDocumentBuilder {
    async build(FloorID, tenant) {
        logger.info(`TenantFireSafetyDisclosureDocumentBuilder.build(${FloorID})`);

        const floor = await FloorDAO.get(FloorID);
        const building = await BuildingDAO.get(floor.BuildingID);
        const property = await PropertyDAO.get(building.PropertyID || floor.PropertyID);

        const devices = await DeviceDAO.all({FloorID});
        const equipments = await EquipmentDAO.all();

        const deviceTypeById = {};
        equipments.forEach(equipmentType => {
            equipmentType.Devices.forEach(deviceType => {
                deviceTypeById[deviceType._id] = deviceType;
            });
        });

        const boundsByDevices = devices.reduce((bounds, device) => {
            if (device.XPos > bounds.x) {
                bounds.x = device.XPos;
            }
            if (device.YPos > bounds.y) {
                bounds.y = device.YPos;
            }

            return bounds;
        }, {x: 200, y: 100});

        const mapImage = floor.Map.Image || (building.Map && building.Map.Image) || property.Map;
        const image = await loadImageByUrl(mapImage);

        const scale = floor.Map.Scale;
        const left = floor.Map.Left;
        const top = floor.Map.Top;

        const w = image.width;
        const h = image.height;
        const canvasWidth = boundsByDevices.x * 1.4; //w - left;
        const canvasHeight = boundsByDevices.y * 1.4; //h - top;
        const mapCanvas = new Canvas(canvasWidth, canvasHeight);
        const ctx = mapCanvas.getContext('2d');

        ctx.drawImage(image, left, top, w, h, 0, 0, w * scale, h * scale);

        const getImageFromBase64 = base64 => {
            return new Promise((resolve, reject) => {
                const img = new Canvas.Image();
                img.onload = () => resolve(img);
                img.src = base64;
            });
        };

        const type2icon = await Promise.props({
            exit: getImageFromBase64(iconsBase64.exit),
            extinguisher: getImageFromBase64(iconsBase64.extinguisher),
            pullstation: getImageFromBase64(iconsBase64.pullstation),
            alarmpanel: getImageFromBase64(iconsBase64.alarmpanel),
            smokedetector: getImageFromBase64(iconsBase64.smokedetector),
        });

        try {
            const getStyleFromDevice = (device) => {
                const deviceType = `${device.DeviceType}`; // ObjectID to string
                const equipmentType = `${device.EquipmentType}`; // ObjectID to string
                return equipment2type[deviceType] || equipment2type[equipmentType];
            };

            const filterEmergencyExit = device => {
                const type = equipment2type[device.DeviceType] && equipment2type[device.DeviceType].type;
                return type !== 'exit' || (type === 'exit' && device.IsEmergencyExit);
            };

            const type2sortOrder = {
                extinguisher: 400,
                exit: 300,
                pullstation: 200,
                alarmpanel: 100,
                smokedetector: 50,
            };

            const devicesSortedByType = devices
                .filter(getStyleFromDevice)
                .filter(device => device.Status !== -1)
                .filter(filterEmergencyExit);

            const alarmPanelsCount = devicesSortedByType.filter(device => getStyleFromDevice(device).type === 'alarmpanel').length;
            let id2alarmPanelsBuildingFloors = {};
            if (alarmPanelsCount === 0) {
                const buildingAlarmPanels = await DeviceDAO.all({
                    BuildingID: building._id,
                    DeviceType: {$in: ["56fa327ddfe0b7562268266e", "5aeb69c13efe111289717df9"]}
                });

                const buildingAlarmPanelsFloors = await FloorDAO.all({
                    _id: {$in: _.keys(_.groupBy(buildingAlarmPanels, 'FloorID'))},
                });

                id2alarmPanelsBuildingFloors = _.keyBy(buildingAlarmPanelsFloors, '_id');
                devicesSortedByType.push(...buildingAlarmPanels);
            }

            const ANNUAL_FREQUENCY = 2;
            const PASS_RECORD_STATUS = 0;

            const inspectionsForDevices = await InspectionDAO.all({
                DeviceID: {$in: devicesSortedByType.map(d => d._id)},
                Frequency: ANNUAL_FREQUENCY,
                // DeviceStatus: PASS_RECORD_STATUS,
            });

            const device2inspections = _.groupBy(inspectionsForDevices, 'DeviceID');

            const annualInspectedDevices = devicesSortedByType.filter(device => {
                const deviceType = getStyleFromDevice(device).type;
                return device2inspections[device._id] && device2inspections[device._id].length
                    || deviceType === 'alarmpanel'
                    || deviceType === 'exit';
            });

            const isTypeShouldBeDrawnOnMap = type => ['alarmpanel', 'pullstation'].indexOf(type) >= 0;

            setAngleForClusteredDevices(annualInspectedDevices.filter(isTypeShouldBeDrawnOnMap));

            const type2devices = _.groupBy(annualInspectedDevices, 'DeviceType');

            const valuesKey2Value = {};
            const typeGroupedByValuesKey = _.keys(type2devices).reduce((typeGroupedByValuesKey, type) => {
                const typeDevices = type2devices[type];

                const deviceTypeType = equipment2type[type].type;

                typeGroupedByValuesKey[type] = _.groupBy(typeDevices, device => {
                    const lastDeviceInspection = device2inspections[device._id] && _.sortBy(device2inspections[device._id], 'InspectionDate').reverse()[0];
                    const lastDeviceInspectionDateKey = lastDeviceInspection && moment(lastDeviceInspection.InspectionDate).format('YYYY-MM-DD');

                    if (deviceTypeType === 'exit') {
                        valuesKey2Value['none'] = {};
                    } else if (deviceTypeType === 'smokedetector') {
                        const deviceInstallationDateKey = device.InstallationDate && moment(device.InstallationDate).format('YYYY-MM-DD');
                        const valuesKey = `${type}|${deviceInstallationDateKey}`;
                        valuesKey2Value[valuesKey] = {};
                        if (deviceInstallationDateKey) {
                            valuesKey2Value[valuesKey].InstallationDate = device.InstallationDate;
                        }

                        return valuesKey;
                    } else if ((deviceTypeType === 'alarmpanel') && (`${device.FloorID}` !== `${FloorID}`)) {
                        const valuesKey = `${type}|${lastDeviceInspectionDateKey}|${device.FloorID}`;
                        valuesKey2Value[valuesKey] = {};
                        if (lastDeviceInspection) {
                            valuesKey2Value[valuesKey].InspectionDate = lastDeviceInspection.InspectionDate;
                        }

                        const alarmPanelFloor = id2alarmPanelsBuildingFloors[device.FloorID];
                        if (alarmPanelFloor) {
                            valuesKey2Value[valuesKey].FloorTitle = alarmPanelFloor.Title;
                        }

                        return valuesKey;
                    } else {
                        const valuesKey = `${type}|${lastDeviceInspectionDateKey}`;
                        valuesKey2Value[valuesKey] = {};
                        if (lastDeviceInspection) {
                            valuesKey2Value[valuesKey].InspectionDate = lastDeviceInspection.InspectionDate;
                        }

                        return valuesKey;
                    }

                });

                return typeGroupedByValuesKey;
            }, {});

            let deviceCounter = 0;
            const deviceLegendRows = [];
            _.keys(typeGroupedByValuesKey)
                .sort((deviceType1, deviceType2) => type2sortOrder[equipment2type[deviceType2].type] - type2sortOrder[equipment2type[deviceType1].type])
                .map(deviceType =>
                    _.keys(typeGroupedByValuesKey[deviceType]).forEach((valuesKey) => {
                        const devices = typeGroupedByValuesKey[deviceType][valuesKey];
                        const type = equipment2type[deviceType].type;
                        const typeShouldBeDrawnOnMap = isTypeShouldBeDrawnOnMap(type);

                        let firstDeviceIcon, lastDeviceIcon;
                        typeShouldBeDrawnOnMap && devices.forEach((device, index) => {
                            deviceCounter++;

                            const radius = 10;
                            const imageWidth = 48;
                            const imageHeight = 48;
                            const imageRadius = 24;

                            const iconCanvas = new Canvas(imageWidth, imageHeight);
                            const iconCtx = iconCanvas.getContext('2d');

                            const iconImage = type2icon[type];

                            iconCtx.drawImage(iconImage, 0 + 2, 0 + 2, imageWidth - 4, imageHeight - 4);

                            iconCtx.fillStyle = deviceTypeById[device.DeviceType + ''].Color;

                            iconCtx.beginPath();
                            iconCtx.arc(imageWidth - radius - 1, imageHeight - radius - 1, radius, 0, 2 * Math.PI);
                            iconCtx.stroke();
                            iconCtx.fill();

                            iconCtx.strokeStyle = '#666666';
                            iconCtx.font = 'bold 20px Roboto, serif';

                            const deviceNumberString = `${deviceCounter}`;
                            let deviceLeftShift = imageWidth - radius - 6;
                            if (deviceNumberString.length > 1) {
                                deviceLeftShift = imageWidth - radius - 12
                            }
                            iconCtx.strokeText(deviceNumberString, deviceLeftShift + 1, imageHeight - radius + 9 + 1);

                            iconCtx.fillStyle = '#FFFFFF';
                            iconCtx.font = 'bold 20px Roboto, serif';
                            iconCtx.fillText(deviceNumberString, deviceLeftShift, imageHeight - radius + 6);

                            if (index === 0) {
                                firstDeviceIcon = iconCanvas.toDataURL();
                            } else {
                                lastDeviceIcon = iconCanvas.toDataURL();
                            }

                            const deviceIconLeft = device.XPos - imageRadius;
                            const deviceIconTop = device.YPos - imageRadius;

                            const isDeviceOnOtherFloor = `${device.FloorID}` !== `${FloorID}`;

                            if (type=== 'alarmpanel') {
                                ctx.globalAlpha = isDeviceOnOtherFloor ? 0.06 : 0.16;
                                const circlesCenterX = device.clusteredAngle != null ? deviceIconLeft : (deviceIconLeft + imageRadius);
                                const circlesCenterY = device.clusteredAngle != null ? deviceIconTop : (deviceIconTop + imageRadius);

                                ctx.fillStyle = "#de2a20";
                                ctx.strokeStyle = '#8a0016';

                                ctx.beginPath();
                                ctx.arc(circlesCenterX, circlesCenterY, 96, 0, 2 * Math.PI);
                                ctx.fill();
                                ctx.beginPath();
                                ctx.arc(circlesCenterX, circlesCenterY, 64, 0, 2 * Math.PI);
                                ctx.fill();
                                ctx.beginPath();
                                ctx.arc(circlesCenterX, circlesCenterY, 32, 0, 2 * Math.PI);
                                ctx.fill();
                            }

                            if (isDeviceOnOtherFloor) {
                                ctx.globalAlpha = 0.4;
                            } else {
                                ctx.globalAlpha = 1;
                            }

                            if (device.clusteredAngle == null) {
                                ctx.drawImage(iconCanvas, deviceIconLeft, deviceIconTop, imageWidth, imageHeight);
                            } else {
                                const center = {
                                    x: deviceIconLeft,
                                    y: deviceIconTop
                                };

                                ctx.fillStyle = "#333333";
                                ctx.strokeStyle = '#333333';

                                ctx.beginPath();
                                ctx.arc(deviceIconLeft, deviceIconTop, 8, 0, 2 * Math.PI);
                                ctx.fill();

                                const lineCirclePoint = getPointOnCircle(center, parseInt(imageRadius * 0.8), device.clusteredAngle);

                                ctx.beginPath();
                                ctx.lineWidth = 4;
                                ctx.moveTo(lineCirclePoint.x, lineCirclePoint.y);
                                ctx.lineTo(deviceIconLeft, deviceIconTop);
                                ctx.stroke();

                                const deviceOnCirclePoint = getPointOnCircle(center, parseInt(imageRadius * 1.6), device.clusteredAngle);
                                ctx.drawImage(iconCanvas, deviceOnCirclePoint.x - imageRadius, deviceOnCirclePoint.y - imageRadius, imageWidth, imageHeight);
                            }


                            if (isDeviceOnOtherFloor) {
                                ctx.globalAlpha = 1;
                            }
                        });
                        let legendText = ``;
                        if (type === 'exit') {
                            legendText = `${devices.length} Emergency Exits`;
                        } else {
                            legendText = `${devices.length} ${deviceTypeById[deviceType].Title}`;;
                        }


                        const {InspectionDate, InstallationDate, FloorTitle} = valuesKey2Value[valuesKey] || {};

                        const legendTextMessages = [];
                        if (InstallationDate) {
                            legendTextMessages.push(`Date Last Replaced in Unit: ${moment(InstallationDate).format(toStringDateFormat)}`);
                        }

                        if (InspectionDate) {
                            legendTextMessages.push(`Annual Service Date: ${moment(InspectionDate).format(toStringDateFormat)}`);
                        }

                        if (FloorTitle) {
                            legendTextMessages.push(`Located on floor: ${FloorTitle}`);
                        }

                        if (legendTextMessages.length) {
                            legendText += ` - ${legendTextMessages.join(', ')}`;
                        }


                        deviceLegendRows.push({
                            type,
                            columns: [
                                typeShouldBeDrawnOnMap ? {
                                    image: firstDeviceIcon,
                                    style: "legendImage",
                                    height: 20,
                                    width: 20,
                                } : undefined
                                ,
                                lastDeviceIcon ? {
                                    text: "—",
                                    style: "legendLabel",
                                    height: 20,
                                    width: 20,
                                    "margin": [10, 4, 10, 10],
                                    alignment: "center"

                                } : undefined
                                ,
                                lastDeviceIcon ? {
                                    image: lastDeviceIcon,
                                    style: "legendImage",
                                    height: 20,
                                    width: 20,
                                } : undefined
                                ,
                                {
                                    text: legendText,
                                    style: "legendLabel",
                                    height: 20,
                                    margin: !typeShouldBeDrawnOnMap ? [0, 0, 0, 0] : undefined
                                }
                            ].filter(r => !!r),
                            margin: [0, 5, 0, 5],
                        });

                    }));

            const mapImageRow = {
                image: "mapImage",
                alignment: "center"
            };

            if (canvasWidth > canvasHeight) {
                mapImageRow.width = 520;
            } else {
                mapImageRow.width = canvasHeight / canvasWidth > 1.5 ? 300 : 400;
            }

            if (_.keys(typeGroupedByValuesKey).filter(deviceType => equipment2type[deviceType].type === 'pullstation').length === 0) {
                deviceLegendRows.push({
                    type: 'pullstation',
                    columns: [
                        {
                            image: iconsBase64.pullstation,
                            style: "legendImage",
                            height: 20,
                            width: 20,
                        },
                        {
                            text: `No Pull Stations`,
                            style: "legendLabel",
                            height: 20,
                            color: "red"
                        }
                    ],
                    margin: [0, 5, 0, 5],
                });
            }

            const documentDefinition = {
                content: [
                    {
                        columns: [
                            {
                                text: property.Title,
                                width: "70%"
                            },
                            {
                                text: `${moment().format(toStringDateFormat)}`,
                                width: "30%",
                                alignment: "right"

                            }
                        ],
                        margin: [0, 10, 0, 10]
                    },
                    {
                        text: "RESIDENT FIRE SAFETY DISCLOSURE INFORMATION",
                        style: "header"
                    },
                    {
                        columns: [
                            {
                                text: `BUILDING ADDRESS: ${property.Street}, ${property.City}`,
                                width: "70%"
                            },
                            {
                                text: `FLOOR/LEVEL: ${floor.Title}`,
                                width: "30%",
                                alignment: "right"

                            }
                        ],
                        margin: [0, 10, 0, 10]
                    },
                    mapImageRow,
                    ...deviceLegendRows.reduce((extendedRows, row) => { // add notices before device type details
                        const currentRowExtended = [row];
                        const lastRowType = extendedRows[extendedRows.length - 1] && extendedRows[extendedRows.length - 1].type;

                        if (extendedRows.length === 0 || (lastRowType && lastRowType !== row.type)) {
                            if (row.type === 'smokedetector') {
                                currentRowExtended.unshift({
                                    text: "SMOKE & CARBON MONOXIDE ALARM DEVICES:",
                                    style: "notice",
                                    alignment: 'left'
                                }, {
                                    text: "TO CONFIRM ALARMS ARE IN WORKING CONDITION, PUSH “TEST” BUTTON ON EACH DEVICE.",
                                    style: "notice",
                                    fontSize: 10,
                                    alignment: 'left',
                                    margin: [0, 10, 0, 10]
                                });
                            }

                            const nextTypeMargin = currentRowExtended[0].margin || [0, 10, 0, 0];
                            nextTypeMargin[1] = 10;
                            currentRowExtended[0].margin = nextTypeMargin;

                            if (lastRowType && lastRowType === 'exit') {
                                currentRowExtended.unshift({
                                    text: "EXITS SHALL REMAIN UNOBSTRUCTED AT ALL TIMES.",
                                    alignment: 'left',
                                    style: "notice",
                                    color: "red",
                                    margin: [0, 4, 0, 6]
                                });
                            }
                        }
                        extendedRows.push(...currentRowExtended);

                        return extendedRows;
                    }, []),
                    {
                        text: "TO REPORT A SUSPECTED FIRE CODE VIOLATION, CONTACT THE FIRE DEPARTMENT AT: 415-558-3300.",
                        style: "notice",
                        fontSize: 10,
                        margin: [0, 20, 0, 4]
                    },
                    {
                        text: "GENERAL FIRE SAFETY GUIDANCE AND FIRE SAFETY TRAINING VIDEO ARE AVAILABLE ON THE SFFD WEBSITE AT: http://sf-fire.org/fire-safety-tips-san-francisco",
                        fontSize: 10,
                        style: "notice"
                    },
                    {
                        template: 'signature',
                        columns: [
                    //         [
                    //             {
                    //                 text: "Date: _______________________",
                    //                 alignment: "center"
                    //             }
                    //         ],
                    //         [
                    //             {
                    //                 text: "_____________________________",
                    //                 style: "signature",
                    //             },
                    //             {
                    //                 text: `${tenant && tenant.name ? tenant.name : "resident signature"}`,
                    //                 style: "signature"
                    //             }
                    //         ],
                        ],
                    //     margin: [0, 40, 0, 0]
                    },
                ],
                images: {
                    mapImage: mapCanvas.toDataURL()
                },
                styles: styles
            };

            return documentDefinition;
        } catch (e) {
            logger.error(e);
        }
    }
}

module.exports = new TenantFireSafetyDisclosureDocumentBuilder();


function loadImageByUrl(url) {
    return new Promise((resolve, reject) => {
        http.get(url)
            .on('response', function (response) {
                // http://stackoverflow.com/a/14269536/478603
                const chunks = [];
                response.on('data', data => chunks.push(data));
                response.on('end', () => {
                    const img = new Canvas.Image();
                    img.src = Buffer.concat(chunks);
                    resolve(img);
                });

            })
            .on('error', reject)
    });
}

const equipment2type = {
    "5a4c18f04d05b872e7b005f8": { // FIRE EXTINGUISHER - DeviceType
        type: "extinguisher",
    },
    "56fa30a9dfe0b75622682662": { // FIRE EXTINGUISHER - DeviceType
        type: "extinguisher"
    },

    "56fa2d50dfe0b75622682654": { // EXIT SIGN - DeviceType
        type: "exit"
    },

    "56fa327ddfe0b75622682664": { // MANUAL PULL STATION - DeviceType
        type: "pullstation"
    },
    "5a4bf15a4d05b872e7afdfae": { // ADDRESSEBLE MANUAL PULL STATION - DeviceType
        type: "pullstation"
    },

    "56fa327ddfe0b7562268266e": { // FIRE ALARM PANEL - DeviceType
        type: "alarmpanel"
    },
    "5aeb69c13efe111289717df9": { // SMOKE CONTROL PANEL - DeviceType
        type: "alarmpanel"
    },

    "56fa327ddfe0b75622682677": { // CARBON MONOXIDE DETECTOR - DeviceType
        type: "smokedetector"
    },
    "56fa327ddfe0b75622682675": { // SMOKE / HEAT DETECTOR - DeviceType
        type: "smokedetector"
    },
    "56fa327ddfe0b75622682673": { // ADDRESSEBLE SMOKE DETECTOR - DeviceType
        type: "smokedetector"
    },
    "56fa327ddfe0b75622682668": { // SMOKE / HEAT / AUDIBLE DETECTOR - DeviceType
        type: "smokedetector"
    },
    "5b3294de6bfed443cdc138ef": { // VESDA SMOKE DETECTOR - DeviceType
        type: "smokedetector"
    },
    "5b32ac1f13fc2143c746d8c4": { // VESDA SMOKE DETECTOR2 - DeviceType
        type: "smokedetector"
    },
    "5b32b048bb4475439d7d2239": { // VESDA SMOKE DETECTOR3 - DeviceType
        type: "smokedetector"
    },
    "56fa327ddfe0b75622682666": { // IONIZATION SMOKE DETECTOR - DeviceType
        type: "smokedetector"
    },
    "56fa327ddfe0b75622682665": { // PHOTO SMOKE DETECTOR - DeviceType
        type: "smokedetector"
    },
};

function setAngleForClusteredDevices(devices) {
    let i = 0;

    while (devices.length > 0 && i < devices.length) {
        const device = devices[i];
        const clustered = _.filter(devices, cluster => (
            cluster.XPos < device.XPos + 5 &&
            cluster.XPos > device.XPos - 5 &&
            cluster.YPos < device.YPos + 5 &&
            cluster.YPos > device.YPos - 5
        ));

        if (clustered.length > 1) {
            const pointsOnCircle = clustered.length;
            const angleStep = parseInt(360 / pointsOnCircle);
            clustered.forEach((device, i) => {
                device.clusteredAngle = angleStep * i;
            });

            devices = _.difference(devices, clustered);
            i = 0;
        } else {
            i++;
        }
    }
}

function getPointOnCircle(center, radius, angle) {
    const x = center.x + radius * Math.cos(-angle * Math.PI / 180);
    const y = center.y + radius * Math.sin(-angle * Math.PI / 180);
    return {x, y};
}
