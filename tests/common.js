var path = require('path');
var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var pathSplit = __dirname.split(path.sep);
for (let i = 0; i < pathSplit.length; i++) {
	if (pathSplit.slice(-1)[0] != 'living-swrpg') {
		pathSplit.pop()
	} else {
		break;
	}
}
var basePath = pathSplit.join(path.sep);
var nodeEnvironment = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'test';

var configRaw = require(basePath + path.sep + "config.json")[nodeEnvironment];
var dbUrl = configRaw.database.url;
var siteUrl = 'http://localhost:' + configRaw.server.port;

var userBody = {
	"firstName": "test",
	"lastName": "user",
	"emailAddress": "user@test.com",
	"birthDate": "2000-01-01",
	"loginName": "testuser",
	"password": "secret password",
	"homeRegion": "southcentral"
};

var adventureBody = {
	"name": "Test Adventure",
	"season": "EP01",
	"summary": "This is a really cool test adventure. Join the test side!",
	"summaryBrief": "Quick test summary",
	"region": "southcentral",
	"pdfUrl": "http://localhost/download/adventure.pdf"
}

function createAdventure(adv, token, callback) {
	chai.request(siteUrl)
	.post('/adventures/')
	.set('Authorization', "Bearer " + token)
	.send(adv)
	.end(function(err, res) {
		callback(res);
	})
}

function getAdventure(uuid, token, callback) {
	chai.request(siteUrl)
	.get('/adventures/' + uuid)
	.set('Authorization', "Bearer " + token)
	.end(function(err, res) {
		callback(res);
	})
}

function createUser(userObj, callback) {
	chai.request(siteUrl)
	.post('/users/')
	.send(userObj)
	.end(function(err, res) {
		callback(res);
	})
}

function disableUser(userObj, token, callback) {
	chai.request(siteUrl)
	.get('/users/disable/' + userObj.upi)
	.set("Authorization", "Bearer " + token)
	.end(function(err, res) {
		callback(res);
	})
}

function userAuth(userObj, callback) {
	chai.request(siteUrl)
	.post('/users/auth')
	.send({
		"loginName": userObj.loginName,
		"password": userObj.password
	})
	.end(function(err, res) {
		callback(res);
	})
}

function duplicateObject(Obj) {
	return JSON.parse(JSON.stringify(Obj));
}

module.exports = {
	basePath: basePath,
	configRaw: configRaw,
	dbUrl: dbUrl,
	siteUrl: siteUrl,
	userBody: userBody,
	adventureBody: adventureBody,
	createAdventure: createAdventure,
	createUser: createUser,
	disableUser: disableUser,
	userAuth: userAuth,
	duplicateObject: duplicateObject,
	getAdventure: getAdventure
}