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
    },
    https: {
        port: 443,
        key: '/etc/letsencrypt/live/fireprotected.com/privkey.pem',
        cert: '/etc/letsencrypt/live/fireprotected.com/cert.pem'
    }
};


const isDebug = true;

const firebase = isDebug ? {
    databaseURL: "https://firecloud-debug.firebaseio.com",
    serviceAccount: {
        type: "service_account",
        project_id: "firecloud-debug",
        private_key_id: "342666355eec45a498d1260e3d70387a89cdbe26",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEoBRkJ94H8PqT\nfLuxxZ6T8OlL4Cm+UUNucrAOecF49TpT2hERSe9TELAC3xRZ6OeLxVdw+O9mxa+e\n4NAtr5gByQCkeHzJhNZ6/tESkCgqGUCs/DjqN+rJl8XPJj4sgqWXyKPCETA6Cob8\n8mrFf/8N+OPRQq3D64bINFqBXUll+pMmotPTBVMhVIVZlJqfybVLoSE0DyItof0r\nzmYCanSQ2JYRg3ftNcJ3LBLsYIkO4mXRS076LXNA8cG7ADwaXmih+OvSLxxHVM49\nGnIh37wCvcOZigq9YtlxE0Zj3BC9SA9hYOXlM/dcNUiRzHmvbmPZokAZdi3fHLIp\nbvdLL7xbAgMBAAECggEAQgdf0aJxtUj/XLfub+xlLFkifxBv9DFl65kn9jR8/Bmd\n1LrOMHgbnlFkShKPywGjgBRtIMr32hNYvonQXwcwjKjrRlAP17x8KiGYJBu04S5J\nwc2Rb1YHylrlWoMFLf1Rjn8aPvl2sIcIfbkKkfhBtnd2SbeSktBtGp46JmclVtEP\nv2BYGfvd/aeiQ7G56dRFbRt8ZEn+sFj5yjRRaxZSBA5LT9Vhudjo0JDAUZUEqSps\n+NsBaHe7Qn94X7D8WEaMyPecynUAyeL+jaASn8zjQT0xtMr2xyK4SKVbShwuZaii\nJUw3XJqW8RkyXRHKuXBP3SO4J9wIl+Ka/7smLYy+AQKBgQDwRACgrO7aGYI0dWEE\ni8YnNrejxeciIOrS95RGoTBZUaFh+puTg0i7AOF0Bk1dAK8Kn+mAXq9k7Q8ytI3h\n1BNajzKpyWTxMDVkOaolW8l+YKpwsgxpDnhAHHXkY8GnlD08F7C7g1l+mChWZM0V\nuty+ZSi1yvSGmMXiTvj/RBI+oQKBgQDRgHUSvOMbBnQM0/aRkfDzxuttPbE5iBzx\nxkFulAoHlZGpjJ1trpJEfYgfAtxJ8qqVgGNFB1URR5HYRVZjePnB3X6hTPrMpnrK\ngaPZwbgIDdSRsdXmtQpuZF5uMnQE0sonKAVCMf/W5YysT2FhxwdZLYYKlzp1oTf5\n+yU4OqKFewKBgQCCVmGAyE9KQUxA6OwYazqzSxuT3GfmO7UnfOcS6Z4w1feWDz0W\naMGrsG6dYk3Vhelu+hDRcovzVCZKe2f8ee+F0OjK8lWwAVb1Z9LFMWW9CPNs7ymM\nVC0nmkjZ/MOxBNmzH6bgEgEai7BWLZiTkSrunjHXbKH54iZ2/iBVWbgMAQKBgFDY\n/NUFVbMZM3G73rxgkJbS3gmjNCBamajn9FpDAPfaTYMbw6kPJF0QAJbPGMnkvtXA\n3Q5HfRmVAABxCZyLk/6vhm2i8mpFmL9LdjrTmjxpce3jrgNBPExLqXFnQQSXf/HK\nbPUVrIB2x2m7nH4KO5i7i63MnH/Gfn6W388qOYu/AoGAYRmJHfy5HYGJgzTP1aRf\nO0zmfw5oMaolygv6SMzC5X/H22Tw9lRFC++1BFb0Ahfsjl+PZJ6M0X+WAU8Df4Rd\nBeJ27LDrYCMVj/6MnzD3c/3MCjsgDpB9KO/7f8nm6erAn4X/zarmjsk1wCtqNgXd\nlShycfRSOuUFQFZ5IAZC92M=\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-9vzpu@firecloud-debug.iam.gserviceaccount.com",
        client_id: "116808951706897807599",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9vzpu%40firecloud-debug.iam.gserviceaccount.com"
    },
    front: {
        apiKey: "AIzaSyAPztJEWapOpGKFr-8Nx_0JOfInoYfZzLI",
        authDomain: "firecloud-debug.firebaseapp.com",
        databaseURL: "https://firecloud-debug.firebaseio.com",
        projectId: "firecloud-debug",
        storageBucket: "firecloud-debug.appspot.com",
        messagingSenderId: "856627060874",
        appId: "1:856627060874:web:466af1257f8af926274d73",

        publicVapidKey: 'BPETPPvJRdfqpZGKXrfNz90HTRloxEHkn3i59jnVJNvLsjMUDxHtjw9ifYytvvwLcj8sCmIYP5JlcfW6A9j7Nzk'
    }
} : {
    databaseURL: "https://firecloud-fireprotected-test.firebaseio.com",
    serviceAccount: {
        type: "service_account",
        project_id: "firecloud-fireprotected-test",
        private_key_id: "caf8067eaff440b3aeca23358f6c3f4ba0bc6e23",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDJxFSs5uiHEu/7\nSmg8656GjFOLPm2eZrsCzJHnfEdm9nIfTlWtvQtcSXMUKnl4L2p72nbACOdtZyxZ\nNhPYxesQ+SYiaTEzj9j/VK4gzdei9BYkgZ8CQsFKTCtAxuG5gMPpkNLxCnI1Leln\nF7WoYpuFkWAHiLWOeLfkqpJfy/SvF9bvTdPDIAB11FnMfuforM13Ua/4xucs+ByY\n18HmflN5A68ESeaAXMlQzrr/3epHjzavwS1v/VDwr8VSmB/t9B1e0sMd6H/j5Eoq\nJdrFSFw/CcAoDzqXPHS3Gzug5PSTL9pYsJoW4Xcm0wjDxQ23BUh8/0ejlJG4YOXa\nxnBhlDB9AgMBAAECggEAEk1LlAJ/Ea+TUrNRaMNDtjc45c7UITP23z5gtsOEc4/D\n0tind3LIOscT1/6xVYhRi6oJrwovufILqQz5eGadl8TN432wv5lbCPAsul+Joaer\n8YRLgOg+wcdOfhn8RDgsrT1ckQ5ORUokm5wgN4W4T0GcWRqaw3FqVuTtEaD90Tr6\nMedj2s+e1dQdPz7ll2N3VXbYmHGuLsgOf+hYnT6K1+GE8hN+48sRTfw/HzWvPJ4k\nNSgW2VGDIi6CIIpGQoao0lXa5HtDkwVH4o4YO9AAjq5hU3Mzqxo96bUohMzkJEjj\nKTWK+T14n2uxtzXWDl5o+27G5vuYE8ln+cDtUSHCyQKBgQD6EcMTWbSOaS756an1\nDmZjYMOwxzYg6krVh4gVf2QG71aHXbPqbkBpyBGBdCCFz4dlHc+Pt7CaltHOPuns\nPDKQ+ey9fYTEWrf/U5yZuD4JBE9olbAi5kk9PSGBgzTqnjXcBQOxCGnLYtJtyc1I\nhUvk6VfvDgDRf1gb/wvI2I1UhQKBgQDOjU/D8fEhAbMIeUnZyc/Jh6nH41GNXWXm\nJQexPlNt54GampWkQJ71SL66Nbf4Aw35Mmq1qAGXMn2LSZ8S5kkuu1yhOI61DacG\ny2I3NEhEMUR3jbKpkMOhlh0+kcS2M8LtwQ7WyRhS/Bbc+ZP7Os/dFh0Adz1Bfi8M\ntQI7s9QJmQKBgQDdLkSqotdOdr40EXZf56KsF3Q+sZSwvEoAX2YADbL9Z0fTZw+x\nNF8IsQq6w2nYsNwClcF2TnSH5wofMApbBkt7a3L3j0OVIOBJlzyVwh4sf4F08aDe\n3Wy+G4m9Mb3mHpVoy46eUOCyIfAZZzqJAE1GZRV/vZT/t3DJImbb+J3YuQKBgQCB\nFJaQoZZLRkCYPxQD4rbT/s//dvP0IDYaCXIxNf31ZQP9ljWGHEw6hWeL/x4lA+Or\no/JD6+Zykr8aWLvsl7WMWtKcfjfQteN3v4p1bVrsIs3i2M6aYTmgtas4+uev5dEf\nu9KGL83frmKrXd0415wnUjZ1oA7L6wuEKWpn3Q3ZoQKBgQDFCD1aqxnVePrEhexg\nOKbCHwAiwlohLGV8CckSQjJxOXCIFRvkOtrn/GrAg6CRKAhYG2aMqN6s3PB5PvLg\njPkYEgBSwddCbwtEP7agfTsEmVJiapg3gEgZge0fvu2B5kKl74AZb5nDeIZ4J2bn\nkchCJYnKUn+wVDRDxjM3juRjZQ==\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-9ic7w@firecloud-fireprotected-test.iam.gserviceaccount.com",
        client_id: "115882711557201201527",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9ic7w%40firecloud-fireprotected-test.iam.gserviceaccount.com"
    },
    front: {
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
    google: {
        apiKey: 'AIzaSyB2qLbJ9eYe6p0UK9sPy3CeWzmpynez4Fg' // console.cloud.google.com API key
    },
    firebase: {
        databaseURL: firebase.databaseURL,
        serviceAccount: firebase.serviceAccount
    },
    front: {
        APIURL: server.url,
        BaseURL: `${server.url}/admin`,
        firebase: firebase.front
    }
};

module.exports = local;
