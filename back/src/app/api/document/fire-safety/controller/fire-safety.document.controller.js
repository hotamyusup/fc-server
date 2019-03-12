'use strict';
const _ = require('lodash');
const Boom = require('boom');
const logger = require('../../../../core/logger');
const Promise = require('bluebird');

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

	get getDocument() {
		return {
			handler: async (request, reply) => {
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

	async createDocument(FloorID, signer, language) {
		const docDefinition = await TenantFireSafetyDisclosureDocumentBuilder.build(FloorID, signer);
		const floor = await FloorDAO.get(FloorID);
		const newDocument = {
			type: 'fire-safety-disclosure',
			Status: 1,
			title: 'RESIDENT FIRE SAFETY DISCLOSURE INFORMATION',
			options: {language},
			definition: docDefinition,
			signer: signer,
			created_at: new Date(),
			updated_at: new Date(),
			PropertyID: floor.PropertyID,
			BuildingID: floor.BuildingID,
			FloorID: floor._id,
		};

		return this.DAO.create(newDocument)
	}

	get generateDocument() {
		return {
			handler: async (request, reply) => {
				const hash = request.query.hash || '';
				const action = 'generateDocument';
				logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

				const {FloorID, tenant, language} = request.payload;

				if (!FloorID) {
					logger.error(`sessionId: ${hash} ${this.controllerName}.${action} FloorID must be defined`);
					return reply(Boom.badImplementation("FloorID must be defined"));
				}

				this.createDocument(FloorID, tenant, language)
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

	get generateDocuments() {
		return {
			handler: async (request, reply) => {
				const hash = request.query.hash || '';
				const action = 'generateDocuments';
				logger.info(`sessionId: ${hash} ${this.controllerName}.${action} start ${JSON.stringify(request.params)}`);

				const {documents} = request.payload;

				if (!documents || !documents.length) {
					logger.error(`sessionId: ${hash} ${this.controllerName}.${action} {documents[]} must be defined`);
					return reply(Boom.badImplementation("{documents[]} must be defined"));
				}

				if (_.filter(documents, document => !document.FloorID).length) {
					logger.error(`sessionId: ${hash} ${this.controllerName}.${action} FloorID must be defined in all documents`);
					return reply(Boom.badImplementation("FloorID must be defined in all documents"));
				}

				Promise
					.map(documents, ({FloorID, signer, language}) => {
						return this.createDocument(FloorID, signer, language)
					})
					.then((models) => {
						logger.info(`sessionId: ${hash} ${this.controllerName}.${action} success`);
						return reply(models.map(model => {
							const modelJSON = model.toJSON();
							delete modelJSON['definition'];
							return modelJSON;
						}));
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
