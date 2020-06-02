'use strict';

const server = {
    host: 'localhost',
    p: 1111,
    protocol: 'http://',
    set port(p) {
        this.p = p;
    },
    get port() {
        return this.p;
    },
    get url() {
        return this.protocol + this.host + ':' + this.p;
    }
};

var local = {
    NODE_ENV: 'development',
    name: 'local',
    server: server,
    database: {
        host: '127.0.0.1',
        port: 27017,
        db: 'Fire',
        username: '',
        password: '',
        get url() {
            if (this.username && this.password) {
                return 'mongodb://' + this.username + ':' + this.password + '@' + this.host + ':' + this.port + '/' + this.db;
            }
            return 'mongodb://' + this.host + ':' + this.port + '/' + this.db;
        }
    },
    firebase: {
        databaseURL: "https://firecloud-fireprotected-test.firebaseio.com",
        serviceAccount: {
            "type": "service_account",
            "project_id": "firecloud-fireprotected-test",
            "private_key_id": "caf8067eaff440b3aeca23358f6c3f4ba0bc6e23",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDJxFSs5uiHEu/7\nSmg8656GjFOLPm2eZrsCzJHnfEdm9nIfTlWtvQtcSXMUKnl4L2p72nbACOdtZyxZ\nNhPYxesQ+SYiaTEzj9j/VK4gzdei9BYkgZ8CQsFKTCtAxuG5gMPpkNLxCnI1Leln\nF7WoYpuFkWAHiLWOeLfkqpJfy/SvF9bvTdPDIAB11FnMfuforM13Ua/4xucs+ByY\n18HmflN5A68ESeaAXMlQzrr/3epHjzavwS1v/VDwr8VSmB/t9B1e0sMd6H/j5Eoq\nJdrFSFw/CcAoDzqXPHS3Gzug5PSTL9pYsJoW4Xcm0wjDxQ23BUh8/0ejlJG4YOXa\nxnBhlDB9AgMBAAECggEAEk1LlAJ/Ea+TUrNRaMNDtjc45c7UITP23z5gtsOEc4/D\n0tind3LIOscT1/6xVYhRi6oJrwovufILqQz5eGadl8TN432wv5lbCPAsul+Joaer\n8YRLgOg+wcdOfhn8RDgsrT1ckQ5ORUokm5wgN4W4T0GcWRqaw3FqVuTtEaD90Tr6\nMedj2s+e1dQdPz7ll2N3VXbYmHGuLsgOf+hYnT6K1+GE8hN+48sRTfw/HzWvPJ4k\nNSgW2VGDIi6CIIpGQoao0lXa5HtDkwVH4o4YO9AAjq5hU3Mzqxo96bUohMzkJEjj\nKTWK+T14n2uxtzXWDl5o+27G5vuYE8ln+cDtUSHCyQKBgQD6EcMTWbSOaS756an1\nDmZjYMOwxzYg6krVh4gVf2QG71aHXbPqbkBpyBGBdCCFz4dlHc+Pt7CaltHOPuns\nPDKQ+ey9fYTEWrf/U5yZuD4JBE9olbAi5kk9PSGBgzTqnjXcBQOxCGnLYtJtyc1I\nhUvk6VfvDgDRf1gb/wvI2I1UhQKBgQDOjU/D8fEhAbMIeUnZyc/Jh6nH41GNXWXm\nJQexPlNt54GampWkQJ71SL66Nbf4Aw35Mmq1qAGXMn2LSZ8S5kkuu1yhOI61DacG\ny2I3NEhEMUR3jbKpkMOhlh0+kcS2M8LtwQ7WyRhS/Bbc+ZP7Os/dFh0Adz1Bfi8M\ntQI7s9QJmQKBgQDdLkSqotdOdr40EXZf56KsF3Q+sZSwvEoAX2YADbL9Z0fTZw+x\nNF8IsQq6w2nYsNwClcF2TnSH5wofMApbBkt7a3L3j0OVIOBJlzyVwh4sf4F08aDe\n3Wy+G4m9Mb3mHpVoy46eUOCyIfAZZzqJAE1GZRV/vZT/t3DJImbb+J3YuQKBgQCB\nFJaQoZZLRkCYPxQD4rbT/s//dvP0IDYaCXIxNf31ZQP9ljWGHEw6hWeL/x4lA+Or\no/JD6+Zykr8aWLvsl7WMWtKcfjfQteN3v4p1bVrsIs3i2M6aYTmgtas4+uev5dEf\nu9KGL83frmKrXd0415wnUjZ1oA7L6wuEKWpn3Q3ZoQKBgQDFCD1aqxnVePrEhexg\nOKbCHwAiwlohLGV8CckSQjJxOXCIFRvkOtrn/GrAg6CRKAhYG2aMqN6s3PB5PvLg\njPkYEgBSwddCbwtEP7agfTsEmVJiapg3gEgZge0fvu2B5kKl74AZb5nDeIZ4J2bn\nkchCJYnKUn+wVDRDxjM3juRjZQ==\n-----END PRIVATE KEY-----\n",
            "client_email": "firebase-adminsdk-9ic7w@firecloud-fireprotected-test.iam.gserviceaccount.com",
            "client_id": "115882711557201201527",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9ic7w%40firecloud-fireprotected-test.iam.gserviceaccount.com"
        }
    },
    front: {
        APIURL: server.url,
        BaseURL: `${server.url}/admin`,
        firebase: {
            apiKey: "AIzaSyCugZvIGDQ_j4Fx_0HHHMiHE-VIuSoxr00",
            authDomain: "firecloud-fireprotected-test.firebaseapp.com",
            databaseURL: "https://firecloud-fireprotected-test.firebaseio.com",
            projectId: "firecloud-fireprotected-test",
            storageBucket: "firecloud-fireprotected-test.appspot.com",
            messagingSenderId: "570771048919",
            appId: "1:570771048919:web:f553f8c2663d9ff62ca392",
            measurementId: "G-0BP8Y7HTB3",

            publicVapidKey: 'BM_VTRDRusuWhanFC7Rh4Zp2ZUlmKme1BT45fdRDxRYFdt2VI40SYvQ0ZGdWTHxoH1wU7UjyGahPdwXg_ENPw6I'
        }
    }
};

module.exports = local;
