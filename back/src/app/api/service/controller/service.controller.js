'use strict';
var Boom = require('boom');
var nodemailer = require('nodemailer');
var gm = require('gm').subClass({imageMagick: true});

class ServiceController {
    get send() {
        return {
            auth: false,
            handler: function (request, reply) {
                var Map = request.payload.Map.replace('http://104.131.141.177', '.');
                var Map = request.payload.Map.replace('http://fc2.fireprotected.com', '.');
                //var Target = Map.replace("./img/","./temp/"+(Math.random() * (9999 - 1111) + 1111)+"-";
                var Target = './img/' + request.payload.Device._id + '.png';
                gm(Map)
                    .fill('red')
                    .stroke('white', 2)
                    .drawCircle(
                        request.payload.PosX,
                        request.payload.PosY,
                        request.payload.PosX + 10,
                        request.payload.PosY + 10
                    )
                    .resize(800, null)
                    .write(Target, function (err) {
                        if (err) return console.dir(arguments);
                        //console.log(this.outname + ' created  :: ' + arguments[3])
                    });

                var name = 'FireCloud System';
                var from = 'noreply_firecloud@fireprotected.com';
                var to = 'firecloudservice@fireprotected.com';

                var smtpTransport = nodemailer.createTransport({
                    service: 'Outlook',
                    host: 'smtp.office365.com',
                    auth: {
                        user: 'firecloud_smtp@fireprotected.com',
//fireclouddigitalocean@gmail.com',
                        //pass: 'Fc161020',
                        pass: 'Poh23320',
                    },
                });

                var Photo = 'N/A';
                var History = 'N/A';

                if (request.payload.Device.Records.length > 0) {
                    History = '<hr />';
                    for (var i = 0; i < request.payload.Device.Records.length; i++) {
                        var Record = request.payload.Device.Records[i];
                        var Frequency = '';
                        switch (Record.Frequency) {
                            case '0':
                                Frequency = 'Quarterly';
                                break;
                            case '1':
                                Frequency = 'Semi';
                                break;
                            case '2':
                                Frequency = 'Annual';
                                break;
                            case '3':
                                Frequency = '5 Yearly';
                                break;
                            default:
                                Frequency = 'Quarterly';
                        }

                        History += '<b>Frequency:</b> ' + Frequency;
                        History += '<br /><b>Reason:</b> ' + Record.Reason;
                        History += '<br /><b>Note:</b> ' + Record.Note;
                        History += '<br /><b>Inspection Date:</b> ' + Record.InspectionDate;
                        History += '<hr />';
                    }
                }
                //return reply("{}");
                if (request.payload.Photo) {
                    Photo = '<img src="' + request.payload.Photo + '" width="90%" />';
                }

                var Pointer =
                    '<img src="' +
                    Target.replace('./', 'http://104.131.141.177/') +
                    '" width="90%" />';

                var mailOptions = {
                    from: from,
                    to: to,
                    subject: 'Service Reqest: ' + request.payload.User,
                    html: '<b>Request Service Details:</b><br /><br /><b>User:</b> ' +
                    request.payload.User +
                    '<br><b>E-Mail:</b> ' +
                    request.payload.Email +
                    '<br><b>Phone:</b> ' +
                    request.payload.Phone +
                    '<br><b>Property:</b> ' +
                    request.payload.Property +
                    '<br><b>Building:</b> ' +
                    request.payload.Building +
                    '<br><b>Floor:</b> ' +
                    request.payload.Floor +
                    '<br><b>Device Type:</b> ' +
                    request.payload.DeviceType +
                    '<br><b>Equipment Type:</b> ' +
                    request.payload.EquipmentType +
                    '<br><b>Installation Date:</b> ' +
                    request.payload.InstallationDate +
                    (request.payload.ExpirationType ? '<br><b>Expiration Type:</b> ' : '') +
                    (request.payload.ExpirationType ? request.payload.ExpirationType : '') +
                    '<br><b>Location:</b> ' +
                    request.payload.Device.DeviceLocation +
                    '<br><b>Notes:</b> ' +
                    request.payload.Device.Notes +
                    '<br><b>Comments:</b> ' +
                    request.payload.Comments +
                    '<br><br><b>History:</b> ' +
                    History +
                    '<br><br><b>Photo:</b> <br>' +
                    Photo +
                    '<br><br><b>Map:</b> <br>' +
                    Pointer,
                };

                /*
                 if(Photo != "N/A"){
                 mailOptions.attachments = [
                 {
                 path: request.payload.photo
                 }
                 ];
                 }
                 */

                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        return reply(error);
                    } else {
                        return reply('{}');
                    }
                });
            },
        };
    }
}

module.exports = new ServiceController();



