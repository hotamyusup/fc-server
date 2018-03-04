'use strict';

var local = {
    name: 'local',
    server: {
        host: '127.0.0.1',
        p: 9999,
        protocol: 'http://',
	set port(p) {
		this.p = p;
	},
	get port() {
		return this.p;
	},
	get url() {
		return this.protocol + this.host + ':' + this.p ;
	}
    },
    database: {
        host: '127.0.0.1',
        port: 27017,
        db: 'Fire',
        username: '',
        password: '',
	get url () {
		if ( this.username && this.password ) {
        		return 'mongodb://' + this.username + ':' + this.password + '@' + this.host + ':' + this.port + '/' + this.db;
	        }
		return 'mongodb://' + this.host + ':' + this.port + '/' + this.db;
	}
    }
};

module.exports = local;
