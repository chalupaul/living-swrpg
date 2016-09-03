// Set up root include path
global.nodeEnvironment = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'production';
console.log("Starting server in", nodeEnvironment, "mode.");
var path = require('path')
global.getRootPath = function() {
	return __dirname;
}
global.rootRequire = function(name) {
    return require(__dirname + path.sep + name);
}

var cluster = require('cluster');

if (cluster.isMaster) {

	var cpuCount = require('os').cpus().length;

	for (var i = 0; i < cpuCount; i += 1) {
		cluster.fork();
	}

	// Listen for dying workers
	cluster.on('exit', function (worker) {

		// Replace the dead worker, we're not sentimental
		console.log('Worker %d died.', worker.id);
		cluster.fork();

	});

	// Code to run if we're in a worker process
} else {
	require('./app');
}
