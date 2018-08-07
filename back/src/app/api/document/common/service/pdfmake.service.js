'use strict';

const Promise = require('bluebird');
const PdfPrinter = require('pdfmake/src/printer');
const fs = require('fs');

const path = require('path');
const PDF_FONTS_LOCATION = {
    Roboto: {
        normal: path.normalize(__dirname + '/fonts/Roboto-Regular.ttf'),
        bold: path.normalize(__dirname + '/fonts/Roboto-Medium.ttf'),
        italics: path.normalize(__dirname + '/fonts/Roboto-Italic.ttf'),
        bolditalics: path.normalize(__dirname + '/fonts/Roboto-MediumItalic.ttf')
    }
};

class PDFMakeService {
    constructor() {
        this.printer = new PdfPrinter(PDF_FONTS_LOCATION);
    }

    createPDFDocument(docDefinition) {
        return new Promise((resolve, reject) => {
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            pdfDoc.end();
            resolve(pdfDoc);
        });
    }
}

module.exports = new PDFMakeService();



