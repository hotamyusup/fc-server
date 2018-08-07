'use strict';
const Promise = require('bluebird');
const http = require('http');
const fs = require('fs');
const Boom = require('boom');
const Canvas = require('canvas-prebuilt');
const path = require('path');
const logger = require('../../../../core/logger');

const BaseController = require("../../../../core/base.controller");
const FireSafetyDAO = require("../dao/fire-safety.document.dao");
const PDFMakeService = require("../../common/service/pdfmake.service");
const EquipmentDAO = require("../../../property/device/dao/equipment.dao");
const DeviceDAO = require("../../../property/device/dao/device.dao");
const FloorDAO = require("../../../property/floor/dao/floor.dao");
const BuildingDAO = require("../../../property/building/dao/building.dao");
const PropertyDAO = require("../../../property/property/dao/property.dao");


class FireSafetyDocumentController extends BaseController {
    constructor() {
        super(FireSafetyDAO);
        this.controllerName = 'FireSafetyDocumentController';
    }

    get generateDocument() {
        return {
            handler: async(request, reply) => {
                const hash = request.query.hash || '';
                const action = 'generateDocument';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {PropertyID, BuildingID, FloorID} = request.query;

                if (!PropertyID && !BuildingID && !FloorID) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} PropertyID or BuildingID or FloorID must be defined`);
                    return reply(Boom.badImplementation("PropertyID must be defined"));
                }

                const floor = await FloorDAO.get(FloorID);
                const building = await BuildingDAO.get(BuildingID || floor.BuildingID);
                const property = await PropertyDAO.get(PropertyID || building.PropertyID || floor.PropertyID);

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
                }, {x: 100, y: 100});

                // const [property, building2, floor] = await Promise.all([
                //     PropertyDAO.get(PropertyID),
                //     BuildingDAO.get(BuildingID),
                //     FloorDAO.get(FloorID)
                // ]);

                const image = await loadImageByUrl(property.Map);

                const scale = floor.Map.Scale;
                const left = floor.Map.Left;
                const top = floor.Map.Top;

                const w = image.width;
                const h = image.height;
                let canvasWidth = boundsByDevices.x * 1.4; //w - left;
                const canvasHeight = boundsByDevices.y * 1.4; //h - top;
                const mapCanvas = new Canvas(canvasWidth, canvasHeight);
                const ctx = mapCanvas.getContext('2d');

                // ctx.drawImage(image, 0, 0);
                ctx.drawImage(image, left, top, w, h, 0, 0, w * scale, h * scale);
                // ctx.drawImage(image, -left ,-top, image.width, image.height );

                const templatePath = path.normalize(__dirname + '/../template/tenant-fire-safety-disclosure-information.document.config.json');
                const docDefinition = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
                const getImageFromBase64 = base64 => {
                    return new Promise((resolve, reject) => {
                        const img = new Canvas.Image();
                        img.onload = () => resolve(img);
                        img.src = base64;
                    });
                };

                const type2icon = await Promise.props({
                    exit: getImageFromBase64(docDefinition.images.exit),
                    extinguisher: getImageFromBase64(docDefinition.images.extinguisher),
                    pullstation: getImageFromBase64(docDefinition.images.pullstation),
                    alarmpanel: getImageFromBase64(docDefinition.images.alarmpanel)
                });

                const deviceLegendRows = [];
                const deviceType2devices = {};
                try {
                    devices.forEach((device) => {
                        const filteredTypes = {
                            "5a4c18b64d05b872e7b005f7": { // EXTINGUISHERS - EquipmentType
                                type: "extinguisher"
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
                        };


                        const deviceType = `${device.DeviceType}`;
                        const equipmentType = `${device.EquipmentType}`;
                        const styleConfig = filteredTypes[deviceType] || filteredTypes[equipmentType];
                        if (styleConfig) {
                            deviceType2devices[styleConfig.type] = deviceType2devices[styleConfig.type] || [];
                            const deviceCounter = deviceType2devices[styleConfig.type].length + 1;

                            const radius = 10;
                            const imageWidth = 48;
                            const imageHeight = 48;
                            const imageRadius = 24;

                            const iconCanvas = new Canvas(imageWidth, imageHeight);
                            const iconCtx = iconCanvas.getContext('2d');


                            const iconImage = type2icon[styleConfig.type];
                            iconCtx.drawImage(iconImage, 0, 0, imageWidth, imageHeight);

                            iconCtx.fillStyle = deviceTypeById[device.DeviceType].Color;

                            iconCtx.beginPath();
                            iconCtx.arc(imageWidth - radius, imageHeight - radius, radius, 0, 2 * Math.PI);
                            iconCtx.stroke();
                            iconCtx.fill();

                            iconCtx.strokeStyle = '#666666';
                            iconCtx.font = 'bold 20px Roboto, serif';
                            iconCtx.strokeText(`${deviceCounter}`, imageWidth - radius - 5 + 1, imageHeight - radius + 9 + 1);

                            iconCtx.fillStyle = '#FFFFFF';
                            iconCtx.font = 'bold 20px Roboto, serif';
                            iconCtx.fillText(`${deviceCounter}`, imageWidth - radius - 5, imageHeight - radius + 6);

                            deviceType2devices[styleConfig.type].push({
                                "style": "text",
                                "columns": [
                                    {
                                        "image": iconCanvas.toDataURL(),
                                        "style": "legendImage",
                                        "width": 24
                                    },
                                    {
                                        "text": deviceTypeById[device.DeviceType + ''].Title,
                                        "style": "legendLabel"
                                    }
                                ]
                            });

                            ctx.drawImage(iconCanvas, device.XPos - imageRadius, device.YPos - imageRadius, imageWidth, imageHeight);
                        }
                    });

                } catch (e) {
                    logger.error(e);
                }


                const processors = {
                    "building_and_floor_address": row => {
                        const replaceTextInColumn = (column, text) => {
                            if (column.text) {
                                column.text = column.text.replace(/_+/g, text);
                            }
                        };
                        if (row.columns && row.columns.length > 1) {
                            replaceTextInColumn(row.columns[0], `${property.Street}, ${building.Title}`);
                            // replaceTextInColumn(row.columns[0], `left: ${floor.Map.Left} top: ${floor.Map.Top} scale: ${floor.Map.Scale}`);
                            replaceTextInColumn(row.columns[row.columns.length - 1], floor.Title);
                            // replaceTextInColumn(row.columns[row.columns.length - 1], building.Title);
                        }
                    }
                };

                docDefinition.content.forEach(row => processors[row.template] && processors[row.template](row));
                docDefinition.content.push(
                    ...Object
                        .keys(deviceType2devices)
                        .reduce((devices, type) => {
                            devices.push(...deviceType2devices[type]);
                            return devices;
                        }, [])
                );

                docDefinition.images.mapImage = mapCanvas.toBuffer('base64');

                return this.handle(action, request, reply, PDFMakeService.createPDFDocument(docDefinition));
            }
        };
    }
}
1
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

module.exports = new FireSafetyDocumentController();