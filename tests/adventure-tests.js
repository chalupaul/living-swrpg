var common = require('./common');
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var MongoClient = require('mongodb').MongoClient;


describe('Adventure', function() {
	var testUser;
	var testAdventure;
	function adventureBoilerPlate(done) {
		testUser = common.duplicateObject(common.userBody);
		testAdventure = common.duplicateObject(common.adventureBody);
		testUser._verified = true;
		testUser.roles = ["inquisitor", "player"];
		common.createUser(testUser, function(res) {
			testUser.upi = JSON.parse(res.text).upi;
			testAdventure.author = testUser.upi;
			// Now auth for a token
			common.userAuth(testUser, function(res) {
				testUser.token = JSON.parse(res.text).token;
				done();
			});
		});
	}
	
	afterEach(function(done){
		MongoClient.connect(common.dbUrl, function(err, db) {
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
			chai.request(common.siteUrl)
			.get('/adventures/schema.json')
			.end(function(err, res) {
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.should.be.an('object');
				done();
			})
		})
	});
	
	describe('#create', function() {
		beforeEach(function(done) {
			adventureBoilerPlate(done);
		});
		it('should create an adventure', function(done) {
			common.createAdventure(testAdventure, testUser.token, function(res) {
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.uuid.should.be.a('string').and.should.not.equal('');
				done();
			});
		});
		it('should not create an adventure with a bad author UPI', function(done) {
			common.createAdventure(testAdventure, "obviouslyBadToken", function(res) {
				res.should.have.status(401);
				done();
			});
			
		});
		it('should not create an adventure without jwt authorization', function(done) {
			chai.request(common.siteUrl)
			.post('/adventures/')
			.send(testAdventure)
			.end(function(err, res) {
				res.should.have.status(403);
				done();
			})
		});
		it('should not create an adventure without an authorized role', function(done) {
			var user1 = common.duplicateObject(common.userBody);
			var adv = common.duplicateObject(common.adventureBody);
			user1._verified = true;
			common.createUser(user1, function(res) {
				user1.upi = JSON.parse(res.text).upi;
				adv.author = user1.upi;
				// Now auth for a token
				common.userAuth(user1, function(res) {
					user1.token = JSON.parse(res.text).token;
					chai.request(common.siteUrl)
					.post('/adventures')
					.send(adv)
					.end(function(err, res) {
						res.should.have.status(403);
						done();
					})
				});
			});
		});
	});
	describe('#get', function(){
		beforeEach(function(done) {
			adventureBoilerPlate(done);
		});
		it('should get an adventure by uuid', function(done) {
			common.createAdventure(testAdventure, testUser.token, function(res) {
				var uuid = JSON.parse(res.text).uuid;
				common.getAdventure(uuid, testUser.token, function(res) {
					res.should.have.status(200);
					var body = JSON.parse(res.text);
					body.uuid.should.equal(uuid);
					done();
				});
			});
		});
		it('should not provide a download link if the user is just a player', function(done) {
			// This test is kind of the definition of callback hell.
			common.createAdventure(testAdventure, testUser.token, function(res) {
				var uuid = JSON.parse(res.text).uuid;
				var player = common.duplicateObject(common.userBody);
				player._verified = true;
				player.roles = ['player'];
				player.loginName = 'readonlyTestuser';
				common.createUser(player, function(res) {
					player.upi = JSON.parse(res.text).upi;
					// Now auth for a token for our player-only user
					common.userAuth(player, function(res) {
						player.token = JSON.parse(res.text).token;
						common.getAdventure(uuid, player.token, function(res) {
							//Make sure it works for players
							res.should.have.status(200);
							var body = JSON.parse(res.text);
							body.pdfUrl.should.equal('');
							done();
						});
					});
				});
			});
		});
		it('should not provide a download link if the user is a gm outside the region', function(done) {
			common.createAdventure(testAdventure, testUser.token, function(res) {
				var uuid = JSON.parse(res.text).uuid;
				var player = common.duplicateObject(common.userBody);
				player._verified = true;
				player.roles = ['player', 'gm'];
				player.homeRegion = 'noncontinental';
				player.loginName = 'naughtyGmTest';
				common.createUser(player, function(res) {
					player.upi = JSON.parse(res.text).upi;
					// Now auth for a token for our player-only user
					common.userAuth(player, function(res) {
						player.token = JSON.parse(res.text).token;
						common.getAdventure(uuid, player.token, function(res) {
							//Make sure it works for players
							res.should.have.status(200);
							var body = JSON.parse(res.text);
							body.pdfUrl.should.equal('');
							done();
						});
					});
				});
			});
		})
		it('should provide a download link if the user is a gm in the same region', function(done) {
			common.createAdventure(testAdventure, testUser.token, function(res) {
				var uuid = JSON.parse(res.text).uuid;
				var player = common.duplicateObject(common.userBody);
				player._verified = true;
				player.roles = ['player', 'gm'];
				player.loginName = 'niceGmTest';
				common.createUser(player, function(res) {
					player.upi = JSON.parse(res.text).upi;
					// Now auth for a token for our player-only user
					common.userAuth(player, function(res) {
						player.token = JSON.parse(res.text).token;
						common.getAdventure(uuid, player.token, function(res) {
							//Make sure it works for players
							res.should.have.status(200);
							var body = JSON.parse(res.text);
							body.pdfUrl.should.not.equal('');
							done();
						});
					});
				});
			});
		})
		it('should fail if passed a bad uuid', function(done) {
			common.getAdventure("12345-12345-12345", testUser.token, function(res) {
				res.should.have.status(404);
				done();
			});
		});
		it('should not provide a download link for anonymous users', function(done) {
			common.createAdventure(testAdventure, testUser.token, function(res) {
				var uuid = JSON.parse(res.text).uuid;
				chai.request(common.siteUrl)
				.get('/adventures/' + uuid)
				.end(function(err, res) {
					res.should.have.status(200);
					var body = JSON.parse(res.text);
					body.pdfUrl.should.equal('');
					done();
				});
			});
		});
	});
	describe('#update', function() {
		beforeEach(function(done) {
			adventureBoilerPlate(function() {
				common.createAdventure(testAdventure, testUser.token, function(res) {
					testAdventure.uuid = JSON.parse(res.text).uuid;
					done();
				});
			});
		});
		it('should update an adventure', function(done) {
			var testAdventure2 = common.duplicateObject(testAdventure);
			testAdventure2.name = "Name is Changed";
			common.updateAdventure(testAdventure.uuid, testAdventure2, testUser.token, function(res) {
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.name.should.equal(testAdventure2.name);
				done();
			})
		});
		it('should not update uuid field', function(done) {
			var testAdventure2 = common.duplicateObject(testAdventure);
			testAdventure2.name = "Name is Changed";
			testAdventure2.uuid = "12345-12345-12345";
			common.updateAdventure(testAdventure.uuid, testAdventure2, testUser.token, function(res) {
				var body = JSON.parse(res.text);
				res.should.have.status(200);
				body.uuid.should.equal(testAdventure.uuid);
				done();
			});
		})
		it('should fail if the uuid is not found', function(done) {
			var testAdventure2 = common.duplicateObject(testAdventure);
			testAdventure2.name = "Name is Changed";
			common.updateAdventure("12345-12345-123", testAdventure2, testUser.token, function(res) {
				var body = JSON.parse(res.text);
				res.should.have.status(404);
				done();
			});
		});
		it('should fail if no jwt headers are sent', function(done) {
			var testAdventure2 = common.duplicateObject(testAdventure);
			
			chai.request(common.siteUrl)
			.post('/adventures/' + testAdventure.uuid)
			.send(testAdventure2)
			.end(function(err, res) {
				res.should.have.status(403);
				done();
			});
		});
		it('should fail if the user is not allowed to update', function(done) {
			var testAdventure2 = common.duplicateObject(testAdventure);
			var user1 = common.duplicateObject(common.userBody);
			user1._verified = true;
			user1.loginName = 'naughtyTestUser';
			user1.roles = ["player"];
			common.createUser(user1, function(res) {
				user1.upi = JSON.parse(res.text).upi;
				// Now auth for a token
				common.userAuth(user1, function(res) {
					user1.token = JSON.parse(res.text).token;
					common.updateAdventure(testAdventure.uuid, testAdventure2, user1.token, function(res) {
						var body = JSON.parse(res.text);
						res.should.have.status(403);
						done();
					});
				});
			});
		});
	});
});