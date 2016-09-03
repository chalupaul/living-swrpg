var fs = require('fs');
var path = require('path');
var winston = require('winston');
var mkdirp = require('mkdirp');
var conf = require('./config');

winston.emitErrs = true;

//Ensule log directory exists so we can write to files there
var logfile = conf.server.logfile || './logs/all-logs.log';
fs.stat(logfile, function(err, stat) {
	if (err) {
		var dirname = require('path').dirname(logfile);
		mkdirp(dirname, function(err) {
			if (err) console.error("Could not create log directory.", err)
		});
	}
})


var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: logfile,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports.logger = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};
