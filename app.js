const app = require('express')();
const util = require('./util');
const apps = require('./apps');

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


app.use('/users', apps.users.routes);


var port = util.config.get('server.port')? Number(util.config.get('server.port')) : 3000;
app.listen(port, () => {
	console.log("Server listening on port", port);
});
