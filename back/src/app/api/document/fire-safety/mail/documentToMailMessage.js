'use strict';

const Promise = require('bluebird');
const path = require('path');
const _ = require('lodash');

const config = require('../../../../../config/config');
const logger = require('../../../../core/logger');

const PDFMakeService = require('../../common/service/pdfmake.service');
const PropertyDAO = require("../../../property/property/dao/property.dao");

module.exports = async function documentToMailMessage(document) {
    const pdfDoc = await PDFMakeService.createPDFDocument(document.definition);

    const signer = document.signer || {};
    const title = `${document.title}${signer.name ? ` - ${signer.name}` : ''}`;

    const property = document.property ? document.property : await PropertyDAO.get(document.PropertyID);
    const propertyManagerEmail = property.Contacts && property.Contacts[0] && property.Contacts[0].Email;
    const propertyManagerPhone = property.Contacts && property.Contacts[0] && property.Contacts[0].Phone;

    const attachments = [{
        filename: `${title}.pdf`,
        content: pdfDoc
    }];

    let html;

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
            'Smoke_CO_Disclosure_Fire_Department.pdf',
        ].map(filename => ({
            filename,
            path: path.normalize(`${__dirname}../../../fire-safety/files/${filename}`)
        }));

        attachments.push(...filesToAttach);

        const attachmentToLiHtml = ({filename}) => `<li>${filename}</li>`
        const attachmentsListHtml = _.map(attachments, attachmentToLiHtml).join('\n');

        html = buildFireSafetyDisclosureHtml(title, attachmentsListHtml, propertyManagerPhone, propertyManagerEmail);

    }

    const from = config.sendgrid.from;

    const DocumentID = `${document._id}`;

    const to = [signer.email];
    if (propertyManagerEmail) {
        //removing prop manager according to FC team request Dec2019
        // to.push(propertyManagerEmail);
    }

    const message = {
        DocumentID,
        from,
        to,
        subject: title,
        html: html,
        title,
        attachments
    };

    return message;
};

function buildFireSafetyDisclosureHtml(title, attachmentsListHtml, propertyPhoneNumber, propertyManagerEmail) {
    const contacts = [];
    if (propertyPhoneNumber) {
        contacts.push(`<a href="tel:${propertyPhoneNumber}">at ${propertyPhoneNumber}</a>`);
    }

    if (propertyManagerEmail) {
        contacts.push(`<a href="mailto:${propertyManagerEmail}">at ${propertyManagerEmail}</a>`);
    }

    return `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
            "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            
        <html xmlns="http://www.w3.org/1999/xhtml" style="height: 100%;">
        
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
                <title>${title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            
            <body style="margin: 0; background-color: #EEEEEE;  min-height: 100%;">
                <table border="0" cellpadding="0" cellspacing="20" width="100%">
                    <tr>
                        <td align="center">
                            <div align="left" style="color: #153643; font-family: Arial, sans-serif; font-size: 1.2em; background-color: #FFFFFF; display: inline-block; padding: 20px; border-radius: 8px;">
                                <div style="font-size: 1.4em; font-weight: 400;">Dear Valued Resident,</div>
                                <div>In compliance with SFFC 409, we are providing the following attachments:</div>
                                <ul>
                                    ${attachmentsListHtml}
                                </ul>
                                <div>
                                    If you have any questions, please reach out to the Leasing Office ${contacts.join(' or ')}.
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
    `
}