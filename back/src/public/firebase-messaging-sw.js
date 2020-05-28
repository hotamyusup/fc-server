console.log(`[firebase-messaging-sw.js] init`);

importScripts('/admin/js/config-front.js');

// Had to be defined before 'importScripts
self.addEventListener('notificationclick', function (event) {
    // event.notification.close();
    console.log(`[firebase-messaging-sw.js] notificationclick triggered:`, event);
    const url = event.notification.data;
    if (url) {
        event.waitUntil(clients.openWindow(url));
    }
});

self.addEventListener("notificationclose", function (event) {
    // console.log('notification closed');
});

importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-messaging.js');

// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp(configFront.firebase);

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function (payload) {
    console.log(`[firebase-messaging-sw.js] Received background message `, payload);
    const {data} = payload;

    const notificationTitle = data.title;
    const notificationOptions = {
        icon: `${configFront.APIURL}/assets/img/cfp-logo.png`,
        sound: `${configFront.APIURL}/assets/notification-sound.mp3`,
        ...data
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

/*
// FCM message example:
    {
        "data": {
            "title": "Hey I'm here",
            "body": "test test test test",
            "icon": "http://localhost:1221/assets/img/cfp-logo.png",
            "data": "http://localhost:1221/admin/properties"
        },
        "to": "eGjeJBy61XNga06EOnAP_l:APA91bEBxn9TB7_szUDJCAMcEqBpn7_vNP5XTfbTEdAt4xQR5sMELUjBx_WsgxBm7ndMRwfAzuIVdh1QG4Qqa_c2Bn66mZ246Ie-mG9xTEB-SvAyC1M4DvAbgl1QQtpCizUH_d0wP8fu"
    }
 */
