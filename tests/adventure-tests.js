var path = require('path');
var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var should = chai.should();
var expect = chai.expect;
var MongoClient = require('mongodb').MongoClient

var pathSplit = __dirname.split(path.sep);
for (let i = 0; i < pathSplit.length; i++) {
	if (pathSplit.slice(-1)[0] != 'living-swrpg') {
		pathSplit.pop()
	} else {
		break;
	}
}
var basePath = pathSplit.join(path.sep);
var nodeEnvironment = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'testing';

var configRaw = require(basePath + path.sep + "config.json")[nodeEnvironment];
var dbUrl = configRaw.database.url;
var siteUrl = 'http://localhost:' + configRaw.server.port;


describe('Adventure', function() {
	afterEach(function(done){
		MongoClient.connect(dbUrl, function(err, db) {
			if(err) {done(err)};
			var User = db.collection('users');
			User.remove({}, function() {
				var Adventure = db.collection('adventures');
				Adventure.remove({}, function() {
					done();
				})
			});
		});
	});
	describe('#schema', function() {
		it('should return json schema', function(done) {
			chai.request(siteUrl)
			.get('/adventures/schema.json')
			.end(function(err, res) {
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.should.be.an('object');
				done();
			})
		})
	});
});