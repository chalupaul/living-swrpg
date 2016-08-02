var fs = require('fs');
var steeltoe = require('steeltoe');

var err, doc = steeltoe(JSON.parse(fs.readFileSync('./config.json', 'utf8')));

if (err) {
	console.log(err)
	doc = {}
}

module.exports = doc;