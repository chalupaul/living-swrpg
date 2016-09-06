var fs = require('fs');
var path = require('path');
var steeltoe = require('steeltoe');

var configFile = path.join(getRootPath(), 'config.json')

var err, doc = steeltoe(JSON.parse(fs.readFileSync(configFile, 'utf8')));

var config = doc.get(nodeEnvironment);
// One little config sanity cleanup, and that's to trim trailing slashes from siteUrl.
config.server.siteUrl = config.server.siteUrl.replace(/\/+$/, "");

if (err) {
	console.error(err)
	doc = {}
}

module.exports = config;