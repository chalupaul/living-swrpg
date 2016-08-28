var app = require('express')();
var util = rootRequire('util');
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
app.use(require('morgan')("combined", { "stream": util.logger.stream }));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create connections, one pool per worker.
var DB = util.getDatabase();

app.use('/users', apps.users.routes);


var port = util.config.get('server.port')? Number(util.config.get('server.port')) : 3000;
app.listen(port, () => {
	console.log("Server listening on port", port);
});
