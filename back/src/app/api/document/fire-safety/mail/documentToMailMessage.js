'use strict';

const Promise = require('bluebird');
const path = require('path');
const _ = require('lodash');

const logger = require('../../../../core/logger');

const PDFMakeService = require('../../common/service/pdfmake.service');
const PropertyDAO = require("../../../property/property/dao/property.dao");

module.exports = async function documentToMailMessage(document) {
    const pdfDoc = await PDFMakeService.createPDFDocument(document.definition);

    const signer = document.signer || {};
    const title = `${document.title}${signer.name ? ` - ${signer.name}` : ''}`;

    const attachments = [{
        filename: `${title}.pdf`,
        content: pdfDoc
    }];

    if (document.type === 'fire-safety-disclosure') {
        const language = document.options && document.options.language || 'ENGLISH';
        const language2fireSafetyDocumentTitle = {
            ENGLISH: 'Fire Safety Tips for SF (Apr 2017).pdf',
            CHINESE: 'SFFD Fire Safety Tips (rev. Aug 2017) - CHINESE.pdf',
            FILIPINO: 'SFFD Fire Safety Tips (rev. Aug 2017) - FILIPINO.pdf',
            RUSSIAN: 'SFFD Fire Safety Tips (rev. Aug 2017) - RUSSIAN.pdf',
            SPANISH: 'SFFD Fire Safety Tips (rev. Aug 2017) - SPANISH.pdf',
            VIETNAMESE: 'SFFD Fire Safety Tips (rev. Aug 2017) - VIETNAMESE.pdf',
        };
        const filename = language2fireSafetyDocumentTitle[language];
        const filePath = path.normalize(`${__dirname}../../../fire-safety/files/${filename}`);
        attachments.push({filename, path: filePath});

        const filesToAttach = [
            'fire alarm sleeping area requirements.pdf',
            'resident fire safety disclosure.pdf',
            'smoke alarm info disclosure.pdf',
            'CO alarm info disclosure.pdf',
        ].map(filename => ({
            filename,
            path: path.normalize(`${__dirname}../../../fire-safety/files/${filename}`)
        }));

        attachments.push(...filesToAttach);
    }

    const property = document.property ? document.property : await PropertyDAO.get(document.PropertyID);
    const propertyManagerEmail = property.Contacts && property.Contacts[0].Email;

    const from = 'noreply_firecloud@fireprotected.com';

    const DocumentID = `${document._id}`;

    const to = [signer.email];
    if (propertyManagerEmail) {
       // to.push(propertyManagerEmail);
    }

    const message = {
        DocumentID,
        from,
        to,
        subject: title,
        title,
        attachments
    };

    return message;
};
