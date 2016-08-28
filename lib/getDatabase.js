var mongoose = require('mongoose');
var config = require('./config');
this.conn;

/* 
 * Mongoose by default sets the auto_reconnect option to true.
 * We recommend setting socket options at both the server and replica set level.
 * We recommend a 30 second connection timeout because it allows for 
 * plenty of time in most operating environments.
 */

function dbInit() {
	var options = { 
		server: { 
			socketOptions: { 
				keepAlive: 300000, 
				connectTimeoutMS: 30000 
			} 
		}, 
		replset: { 
			socketOptions: { 
				keepAlive: 300000, 
				connectTimeoutMS : 30000 
			} 
		} 
	};

	dbURI = config.get('database.uri');
	console.log(dbURI);
	mongoose.connect(dbURI, options);


	mongoose.connection.on('connected', function () {  
		console.log('Mongoose connection open to ' + dbURI);
	});

	mongoose.connection.on('error',function (err) {  
		console.log('Mongoose connection error: ' + err);
	});
	
	mongoose.connection.on('disconnected', function () {  
		console.log('Mongoose connection disconnected'); 
	});
	
	process.on('SIGINT', function() {  
		mongoose.connection.close(function () { 
			console.log('Mongoose connection disconnected through app termination'); 
			process.exit(0); 
		}); 
	});

	this.conn = mongoose.connection; 
	conn.once('open', function(){
		this.conn = conn;
	});
}

function getDb() {
	if (this.conn == undefined) {
		dbInit();
	}
	return this.conn;
}

module.exports = getDb;
