var fs = require('fs');
var path = require('path');
var steeltoe = require('steeltoe');

var configFile = path.join(getRootPath(), 'config.json')
console.log(configFile);

var err, doc = steeltoe(JSON.parse(fs.readFileSync(configFile, 'utf8')));

if (err) {
	console.log(err)
	doc = {}
}

module.exports = doc;