var path = require('path');
var crypto = require('crypto');
var chai = require('chai');
var chaiHttp = require('chai-http');
var jwt = require('jsonwebtoken');
chai.use(chaiHttp);
var should = chai.should();
var expect = chai.expect;
var MongoClient = require('mongodb').MongoClient
var Validator = require('jsonschema').Validator;


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

describe('User', function() {
	afterEach(function(done){
		MongoClient.connect(dbUrl, function(err, db) {
			if(err) {done(err)};
			var collection = db.collection('users');
			collection.remove({}, function() {
				done();
			});
		});
	});
	
	var userBody = {
		"firstName": "test",
		"lastName": "user",
		"emailAddress": "user@test.com",
		"birthDate": "2000-01-01",
		"loginName": "testuser",
		"password": "secret password",
		"homeRegion": "southcentral"
	};
	
	function createUser(userObj, callback) {
		chai.request(siteUrl)
		.post('/users/')
		.send(userObj)
		.end(function(err, res) {
			callback(res);
		})
	}
	
	function disableUser(userObj, token, callback) {
		/*@userObj: user object*/
		/*token: array. First element is the header. second element is the jwt token */
		/*callback: returns response*/
		chai.request(siteUrl)
		.get('/users/disable/' + userObj.upi)
		.set(token[0], token[1])
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
	
	function duplicateUser(userObj) {
		return JSON.parse(JSON.stringify(userObj));
	}
	// POST /users/
	describe('#create', function() {
		it('should refuse user requests that do not validate the json schema', function(done) {
			// Unnecessary to test anything other than 1 kind: email
			var badUser = duplicateUser(userBody);
			badUser['emailAddress'] = 'bad_email';
			badUser['loginName'] = 'testuser2';
			createUser(badUser, function(res) {
				res.should.have.status(400);
				done();
			})
		});
		it('should not create users with an already used loginName', function(done){
			createUser(userBody, function(res) {
				createUser(userBody, function(res) {
					res.should.have.status(400);
					done();
				});
			});
		});
		it('should return a hidden password', function(done) {
			createUser(userBody, function(res) {
				res.should.have.status(200);
				var body = JSON.parse(res.text);
				// Hackish, but sufficient. Will break if the reply ever changes.
				body.password.should.equal('********');
				done();
			});
		});
		it('should return a valid upi', function(done) {
			createUser(userBody, function(res) {
				var body = JSON.parse(res.text);
				body.upi.should.be.a.number;
				done();
			})
		});
		it('should auto-populate roles as [user]', function(done) {
			createUser(userBody, function(res) {
				var body = JSON.parse(res.text);
				body.roles.should.deep.equal(['user']);
				done();
			})
		})
	});
	
	// GET /users/schema.json
	describe('#schema', function() {
		it('should return json schema', function(done) {
			chai.request(siteUrl)
			.get('/users/schema.json')
			.end(function(err, res) {
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.should.be.an('object');
				done();
			})
		});
	});
	
	// GET /users/:upi
	describe('#get', function() {
		var testUpi;
		beforeEach(function(done) {
			createUser(userBody, function(res) {
				testUpi = JSON.parse(res.text).upi;
				done();
			})
		});
		it('should return a user by upi', function(done) {
			chai.request(siteUrl)
			.get('/users/' + testUpi)
			.end(function(err, res) {
				res.should.have.status(200);
				var body = JSON.parse(res.text);
				// Ensure the loginName is pulled in
				body.loginName.should.equal(userBody.loginName);
				// Ensure there's no _verified field (sanitized properly).
				body.should.not.have.property('_verified');
				done();
			});
		});
		it('should fail to get an unknown user with 404', function(done) {
			chai.request(siteUrl)
			.get('/users/123456789012')
			.end(function(err, res) {
				res.should.have.status(404);
				done();
			})
		})
	});
	describe('#auth', function() {
		var testUpi;
		beforeEach(function(done) {
			createUser(userBody, function(res) {
				// Turn off verification
				testUpi = JSON.parse(res.text).upi;
				MongoClient.connect(dbUrl, function(err, db) {
					if(err) {done(err)};
					var collection = db.collection('users');
					collection.findOneAndUpdate({'upi':testUpi}, {$set: {'_verified': true}}, function(err, r) {
						done();
					});
				});
			});
		});
		it('should return 200 on real login', function(done) {
			// Got to set verified = true
			userAuth(userBody, function(res) {
				// 200 OK is good login
				res.should.have.status(200);
				// Make sure jwt headers are there
				var token = JSON.parse(res.text).token;
				var decoded = jwt.verify(token, configRaw.server.tokenSecret);
				decoded.loginName.should.equal(userBody.loginName);
				done()
			});
		});
		it('should not allow bad login names', function(done) {
			var badUser = duplicateUser(userBody);
			badUser.loginName = 'badlogin';
			userAuth(badUser, function(res) {
				res.should.have.status(401);
				done();
			})
		})
		it('should not allow bad passwords', function(done) {
			var badUser = duplicateUser(userBody);
			badUser.password = 'badpassword';
			userAuth(badUser, function(res) {
				res.should.have.status(401);
				done();
			})
		});
		it('should not allow disabled users', function(done) {
			MongoClient.connect(dbUrl, function(err, db) {
				if(err) {done(err)};
				var collection = db.collection('users');
				collection.findOneAndUpdate({'upi':testUpi}, {$set: {'_adminDisabled': true}}, function(err, r) {
					userAuth(userBody, function(res) {
						res.should.have.status(401);
						done();
					});
				});
			});
		});
		it('should not allow unverified users', function(done) {
			MongoClient.connect(dbUrl, function(err, db) {
				if(err) {done(err)};
				var collection = db.collection('users');
				collection.findOneAndUpdate({'upi':testUpi}, {$set: {'_verified': false}}, function(err, r) {
					userAuth(userBody, function(res) {
						res.should.have.status(401);
						done();
					});
				});
			});
		});
	});
	describe('#disable', function() {
		var user1 = duplicateUser(userBody);
		user1._verified = true;
		
		var user2 = duplicateUser(userBody);
		user2.loginName = 'user2';
		user2.roles = ['inquisitor', 'user'];
		user2._verified = true;
		
		beforeEach(function(done) {
			createUser(user1, function(res) {
				user1.upi = JSON.parse(res.text).upi;
			});
			createUser(user2, function(res) {
				user2.upi = JSON.parse(res.text).upi;
				userAuth(user2, function(res) {
					user2.token = [
						'Authorization',
						'Bearer ' + JSON.parse(res.text).token
					];
					done();
				});
			});
		});

		it('should return the user on sucessful user disable.', function(done) {
			disableUser(user1, user2.token, function(res) {
				// First make sure the return is good
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.should.be.an('object');
				body.upi.should.equal(user1.upi);

				// Now make sure its actually disabled
				MongoClient.connect(dbUrl, function(err, db) {
					if(err) {done(err)};
					var collection = db.collection('users');
					collection.findOne({'upi':user1.upi}, function(err, doc) {
						doc._adminDisabled.should.be.true;
						done();
					});
				});
			});
		});
		it('should reject unauthorized user', function(done) {
			// Got to 'unauthorize' user2 and reauth to get a new token
			MongoClient.connect(dbUrl, function(err, db) {
				if(err) {done(err)};
				var collection = db.collection('users');
				collection.findOneAndUpdate({'upi':user2.upi}, {$set: {'roles': ['user']}}, function(err, r) {
					userAuth(user2, function(res) {
						user2.token = [
							'Authorization',
							'Bearer ' + JSON.parse(res.text).token
						];
						disableUser(user1, user2.token, function(res) {
							res.should.have.status(403);
							done();
						});
					});
				});
			});
		});
		it('should reject request without jwt Authorization header', function(done) {
			var badToken = ['Authorization', 'Bearer obviouslyBad'];
			disableUser(user1, badToken, function(res) {
				res.should.have.status(401);
				done();
			});
		});
	});
	describe('#verify', function() {
		var encryptAlgorithm = 'aes-256-ctr'
		var secret = configRaw.server.tokenSecret;
		function encrypt(text) {
			text = '' + text; // Ensure string
			var cipher = crypto.createCipher(encryptAlgorithm, secret)
			var crypted = cipher.update(text,'utf8','hex')
			crypted += cipher.final('hex');
			return crypted;
		}
		function decrypt(text) {
			var decipher = crypto.createDecipher(encryptAlgorithm, secret)
			var dec = decipher.update(text,'hex','utf8')
			dec += decipher.final('utf8');
			return dec;
		}
		var testUser;
		beforeEach(function(done) {
			testUser = duplicateUser(userBody);
			createUser(testUser, function(res) {
				testUser.upi = JSON.parse(res.text).upi;
				done();
			});
		});
		
		it('should return a user after verifying', function(done) {
			var hashedUpi = encrypt(testUser.upi);	
			chai.request(siteUrl)
			.get('/users/verify/' + hashedUpi)
			.end(function(err, res) {
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.should.be.an('object');
				body.upi.should.equal(testUser.upi);
				// Now make sure it actually made it verified.
				MongoClient.connect(dbUrl, function(err, db) {
					if (err) {done(err)};
					var collection = db.collection('users');
					collection.findOne({'upi':testUser.upi}, function(err, doc) {
						doc._verified.should.be.true;
						done();
					});
				});
			});
		});
		it('should reject on unknown upi', function(done) {
			var hashedUpi = encrypt('123456789012');
			chai.request(siteUrl)
			.get('/users/verify/' + hashedUpi)
			.end(function(err, res) {
				res.should.have.status(401);
				done();
			})
		});
	})
});