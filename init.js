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
