'use strict';
const _ = require('lodash');
const Boom = require('boom');
const logger = require('../../../../core/logger');

const FireSafetyDAO = require("../dao/fire-safety.document.dao");
const FloorDAO = require("../../../../api/property/floor/dao/floor.dao");
const BaseController = require("../../../../core/base.controller");

const TenantFireSafetyDisclosureDocumentBuilder = require("../template/tenant-fire-safety-disclosure-information.document-builder");
const PDFMakeService = require("../../common/service/pdfmake.service");

class FireSafetyDocumentController extends BaseController {
    constructor() {
        super(FireSafetyDAO);
        this.controllerName = 'FireSafetyDocumentController';
        this.requestIDKey = 'DocumentID';
    }

    get signDocument() {
        return {
            handler: async(request, reply) => {
                const hash = request.query.hash || '';
                const action = 'signDocument';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);
                const documentID = request.params.DocumentID;
            }
        }
    }

    get getDocument() {
        return {
            handler: async(request, reply) => {
                const hash = request.query.hash || '';
                const action = 'getDocument';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {FloorID} = request.query;

                if (!FloorID) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} FloorID must be defined`);
                    return reply(Boom.badImplementation("FloorID must be defined"));
                }

                const docDefinition = await TenantFireSafetyDisclosureDocumentBuilder.build(FloorID);

                return this.handle(action, request, reply, PDFMakeService.createPDFDocument(docDefinition));
            }
        };
    }

    get generateDocument() {
        return {
            handler: async(request, reply) => {
                const hash = request.query.hash || '';
                const action = 'generateDocument';
                logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

                const {FloorID} = request.query;

                if (!FloorID) {
                    logger.error(`sessionId: ${hash} ${this.controllerName}.${action} FloorID must be defined`);
                    return reply(Boom.badImplementation("FloorID must be defined"));
                }

                const docDefinition = await TenantFireSafetyDisclosureDocumentBuilder.build(FloorID);

                const floor = await FloorDAO.get(FloorID);

                const newDocument = {
                    type: 'fire-safety-disclosure',
                    title: 'TENANT FIRE SAFETY DISCLOSURE INFORMATION',
                    definition: docDefinition,
                    created_at: new Date(),
                    updated_at: new Date(),
                    PropertyID: floor.PropertyID,
                    BuildingID: floor.BuildingID,
                    FloorID: floor._id,
                };

                return this.DAO
                    .create(newDocument)
                    .then((model) => {
                        logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
                        model = model.toJSON();
                        delete model['definition'];
                        return reply(model);
                    })
                    .catch(err => {
                        logger.error(`sessionId: ${hash} ${this.controllerName}.${action} error ${err}`);

                        if (11000 === err.code || 11001 === err.code) {
                            return reply(Boom.forbidden('please provide another id, it already exist'));
                        }
                        return reply(Boom.forbidden(err)); // HTTP 403
                    });

            }
        };
    }
}

module.exports = new FireSafetyDocumentController();