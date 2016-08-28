var app = require('express')();
var lib = rootRequire('lib');
var apps = rootRequire('apps');

var blocked = require('blocked');

// uncomment to cry
/*blocked(function(ms) {
    console.log("Blocked");
}, {threshold:100});
*/
//////////////////
// General setup
//////////////////

// Hide our identity
app.disable("x-powered-by");

// set up logging
app.use(require('morgan')("combined", { "stream": lib.logger.stream }));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create connections, one pool per worker.
var DB = lib.getDatabase();

app.use('/users', apps.users.routes);


var port = lib.config.get('server.port')? Number(lib.config.get('server.port')) : 3000;
app.listen(port, () => {
	console.log("Server listening on port", port);
});
