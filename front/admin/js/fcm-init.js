var firebaseConfig = configFront.firebase;
firebase.initializeApp(firebaseConfig);

if ('Notification' in window) {
    var messaging = firebase.messaging();

    messaging.usePublicVapidKey(configFront.firebase.publicVapidKey);

    const notificationSoundSrc = '/assets/notification-sound.mp3';
    const notificationSoundAudio = new Audio(notificationSoundSrc);

    messaging.onMessage((payload) => {
        console.log('Message received. ', payload);
        const {data} = payload;

        const notificationTitle = data.title;
        const icon = `${configFront.APIURL}/assets/img/cfp-logo.png`;
        const notificationOptions = {icon, ...data};

        try {
            notificationSoundAudio.play();
        } catch (e) {

        }

        User && User.fetchNotifications();
    });

    if (Notification.permission === 'granted') {
        subscribeToFCM();
    } else {
        // subscribeToFCM(); // could add onClick handler

        // $('#subscribe').on('click', function () {
        //     subscribe();
        // });
    }

    messaging.onTokenRefresh(function () {
        messaging.getToken().then(function (refreshedToken) {
            console.log('Token refreshed.');
            console.log(refreshedToken);
            sendTokenToServer(refreshedToken);
        }).catch(function (err) {
            console.log('Unable to retrieve refreshed token ', err);
        });
    });
}

function subscribeToFCM() {
    messaging.requestPermission()
        .then(function () {
            messaging.getToken()
                .then(function (currentToken) {
                    console.log(`currentToken`, currentToken);
                    if (currentToken) {
                        sendTokenToServer(currentToken);
                    } else {
                        console.warn('Unable to retrieve token');
                        sendTokenToServer();
                    }
                })
                .catch(function (err) {
                    console.warn('Unable to retrieve token', err);
                    sendTokenToServer();
                });
        })
        .catch(function (err) {
            console.warn(`Couldn't get notification permissions`, err);
        });
}

function sendTokenToServer(currentToken) {
    if (!currentToken) {
        console.log('Removing token');
        API.deleteTokenFromCurrentUser(currentToken);
        clearTokenSentToServer();
    } else if (!isTokenSentToServer(currentToken)) {
        console.log('Sending token to server');
        API.addTokenToCurrentUser(currentToken);
        setTokenSentToServer(currentToken);
    } else {
        console.log('Token already sent to server');
    }
}

function isTokenSentToServer(currentToken) {
    const sentFirebaseMessagingToken = window.localStorage.getItem('sentFirebaseMessagingToken');
    return sentFirebaseMessagingToken == currentToken;
}

function clearTokenSentToServer() {
    window.localStorage.removeItem('sentFirebaseMessagingToken');
}

function setTokenSentToServer(currentToken) {
    window.localStorage.setItem('sentFirebaseMessagingToken', currentToken);
}

document.onvisibilitychange = function () {
    if (!document.hidden) {
        User && User.fetchNotifications();
    }
};
