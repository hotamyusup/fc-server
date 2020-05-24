console.log('[firebase-messaging-sw.js] init');

// Had to be defined before 'importScripts
self.addEventListener('notificationclick', function (event) {
    event.stopImmediatePropagation();

    event.notification.close();
    console.log('Notification notificationclick triggered::', event);
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});

self.addEventListener("notificationclose", function(event) {
    console.log('notification close');
});

importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-messaging.js');

// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyCugZvIGDQ_j4Fx_0HHHMiHE-VIuSoxr00",
    authDomain: "firecloud-fireprotected-test.firebaseapp.com",
    databaseURL: "https://firecloud-fireprotected-test.firebaseio.com",
    projectId: "firecloud-fireprotected-test",
    storageBucket: "firecloud-fireprotected-test.appspot.com",
    messagingSenderId: "570771048919",
    appId: "1:570771048919:web:f553f8c2663d9ff62ca392",
    measurementId: "G-0BP8Y7HTB3"
});

const messaging = firebase.messaging();

// messaging.setBackgroundMessageHandler(function(payload) {
//     console.log('[firebase-messaging-sw.js] Received background message ', payload);
//     // Customize notification here
//
//     return self.registration.showNotification(payload.data.title,
//         Object.assign({data: payload.data}, payload.data));
// });

messaging.setBackgroundMessageHandler(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const {data} = payload;

    const notificationTitle = data.title;
    const notificationOptions = {
        icon: "http://localhost:1111/assets/img/cfp-logo.png",
        ...data
    };

    return self.registration.showNotification('BG:::' + notificationTitle, notificationOptions);
});
// [END background_handler]

//
// self.addEventListener('notificationclick', function(event) {
//     console.log('SW: Clicked notification', event)
//
//     let data = event.notification.data
//
//     event.notification.close()
//
//     self.clients.openWindow(event.notification.data.link)
// })
//
// self.addEventListener('push', event => {
//     let data = {}
//
//     if (event.data) {
//         data = event.data.json()
//     }
//
//     console.log('SW: Push received', data)
//
//     if (data.notification && data.notification.title) {
//         self.registration.showNotification(data.notification.title, {
//             body: data.notification.body,
//             icon: 'http://localhost:1111/assets/img/cfp-logo.png',
//             data
//         })
//     } else {
//         console.log('SW: No notification payload, not showing notification')
//     }
// })


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
