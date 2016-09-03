var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var should = chai.should();

var state = {};
function create_user() {
	
}

describe('User', function() {
	describe('#post /', function() {
		it('should create a new user', function(){
			chai.request('http://localhost:3000')
			.post('/')
			.send({
				"firstName": "test",
				"lastName": "user",
				"emailAddress": "user@test.com",
				"birthDate": "2000-01-01",
				"language": "en",
				"loginName": "testuser",
				"password": "secret password",
				"homeRegion": "southcentral"
			})
			.then(function(res) {
				res.should.have.status(200);
			})
		});
	});
});
/*	
	
	it('should validate new user requests against json schema');
	it('should save a user to the database');
	it('should auth a valid user');
	it('should attach a valid jwt token with user data');
	it('should ensure login names are unique');
	it('should generate a UPI');
	it('should hash a user password');
})
*/