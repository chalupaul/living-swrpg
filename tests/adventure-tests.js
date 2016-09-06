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
				res.should.have.status(401);
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
						res.should.have.status(401);
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
			done();
		});
		it('should fail if passed a bad uuid', function(done) {
			done();
		});
		it('should fail if made by an anonymous user', function(done) {
			done();
		});
		it('should fail if no jwt header', function(done) {
			done();
		});
	});
});