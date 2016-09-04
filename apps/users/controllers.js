var models = require('./models');
var async = require('async');
var lib = rootRequire('lib');


bcrypt = require('bcrypt-nodejs');

var Ajv = require('ajv');
var ajv = new Ajv({ useDefaults: true, loadSchema: loadSchema });

// This function is called to retrieve other schema files referenced by a main one.
// This is largely untested as most of the schemas are 1 file only.
function loadSchema(uri, callback) {
    request.json(uri, function(err, res, body) {
        if (err || res.statusCode >= 400)
            callback(err || new Error('Loading error: ' + res.statusCode));
        else
            callback(null, body);
    });
}

// Fetches user from db
function getUser(req, res, next) {
	return new Promise(function(resolve, reject) {
		var upi = req.params.upi;
		var User = models.user.model;
		User.findOne({'upi':upi}, function(err, user) {
			if (err) {reject(err);}
			if (user == null) {
				err = new Error('User not found.');
				err.name = 'UserError';
				err.statusCode = 404;
				err.scope= 'lswrpg';
				err.error = {
					"request": {
						"upi": req.params.upi
					},
					"message": err.message
				}
				reject(err);
			}
			resolve(user);
		});
	})
	.then(function(user) {
		//get baked user vars
		user.getUserSafe(function(err, safeVals) {
			res.locals.user = safeVals;
			next();
		});
	})
	.catch(function(err) {
		next(err);
	});
}

// Validates user objects against json schema. Note: This doesn't create uuids or things like that.
function validateUser(req, res, next) {
	var schema = models.user.schema;

	ajv.compileAsync(schema, function (err, validate) {
		if (err) {
			console.error('Failed to compile schema. This is a bug.', schema);
			return next(err);
		}
		validate(req.body)
		.then(function (valid) {
			return next();
		})
		.catch(function (err) {
			err.name = 'ValidationError';
			err.scope = 'lswrpg';
			err.statusCode = 400;
			err.error = err.errors[0];
			return next(err);
		});
	})
}

// Turn off a user account.
function disableUser(req, res, next) {
	return new Promise(function(resolve, reject) {
		// Fetch user by upi
		var upi = req.params.upi;
		var User = models.user.model;
		User.findOne({'upi':upi}, function(err, user) {
			if (err) {reject(err);}
			if (user == null) {
				err = new Error('User not found.');
				err.name = 'UserError';
				err.statusCode = 404;
				err.scope = 'lswrpg';
				err.error = {
					"request": {
						"upi": upi
					},
					"message": err.message
				};
				reject(err);
			} else {
				resolve(user);
			}
		});		
	})
	.then(function(user) {
		// Disable user
		return new Promise(function(resolve, reject) {
			user._adminDisabled = true;
			user.save(function(error, object, numAffected) {
				if (error) {
					reject(error);
				} else {
					resolve(object);
				}
			});
		});
	})
	.then(function(user) {
		user.getUserSafe(function(err, safeVals) {
			res.locals.user = safeVals;
			next();
		});
	})
	.catch(function(err) {
		next(err);
	})
}

// Create user objects and persist them in the database.
function createUser(req, res, next) {
	new Promise(function(resolve, reject) {
		// pop off user vars
		resolve(req.body)
	})
	.then(ensureUniqueLogin)
	.then(hashUserPassword)
	.then(generateUpi)
	.then(function(user) {
		// Load mongoose model
		// Takes in a req body user request (pojo)
		// outputs mongoose model with populated data
		return new Promise(function(resolve, reject) {
			var User = models.user.model;
			u = new User(user);
			resolve(u);
		});
	}).then(function(user){
		// Save user
		// Takes in a mongoose model of a user
		// Outputs a mongoose document instance of a user
		return new Promise(function(resolve, reject) {
			var User = models.user.model;
			u = new User(user);
			u.save(function(error, object, numAffected) {
				if (error) {
					reject(error);
				} else {
					resolve(object);
				}
			})
		})
	}).then(function(user) {
		//get baked user vars
		console.log(user);
		user.getUserSafe(function(err, safeVals) {
			res.locals.user = safeVals;
			next();
		});
	}).catch(function(err) {
		next(err);
	})
}

// Makes sure a user is authd and add his jwt key
function userAuthenticate(req, res, next) {
	var loginName = req.body.loginName;
	var password = req.body.password;
	return new Promise(function(resolve, reject) {
		var User = models.user.model;
		var user = User.findOne({"loginName":loginName, "_adminDisabled": false, "_verified": true}, function(err, user) {
			if (err) {reject(err);}
			if (user == null) {
				// boolean false
				reject(false);
			} else {
				resolve(user);
			}
		})
	}).then(function(user) {
		var hash = user['password'];
		return new Promise(function(resolve, reject) {
			bcrypt.compare(password, hash, function(err, res) {
				if (err) { reject(err);}
				if (res) {
					resolve(user);
				} else {
					// boolean false
					reject(res);
				}
			})
		})
	}).then(function(user) {
		user.getUserSafe(function(err, safeVals) {
			return new Promise(function(resolve, reject) {
				res.locals.user = safeVals;
				lib.encryption.sign(res.locals.user, function(err, token) {
					if (err) {reject(err);}
					res.locals.token = token;
					next();
				})
			})
		})
	}).catch(function(err) {
		if (err == false) {
			// False is either "couldnt find this user", "user is unverified/disabled", or "bad password"
			err = new Error('Username or Password incorrect.');
			err.scope = 'lswrpg';
			err.name = 'AuthenticationError';
			err.statusCode = 401;
			err.error = {
				"message": err.message,
				"request": {
					"loginName": req.body.loginName,
					"password": '********'
				}
			}
		}
		next(err);
	});
}

// Checks to make sure a login name is unique.
function ensureUniqueLogin(user) {
	return new Promise(function(resolve, reject) {
		var User = models.user.model;
		User.count({'loginName': user.loginName}, function(err, count) {
			if (err) {reject(err);}
			if (count != 0) {
				err = new Error('Login name already taken.');
				err.statusCode = 400;
				err.name = 'ValidationError';
				err.scope = 'lswrpg';
				err.statusCode = 400;
				err.error = {
					"dataPath": ".loginName",
					"keyword": "required",
					"message": err.message,
					"schemaPath": "#/required"
				};
				reject(err);
			} else {
				resolve(user);
			}
		})
	})
}

// Generates a upi number (12 digit number). Ensures the number is unique in the database.
function generateUpi(user) {
	return new Promise(function(resolve, reject) {
		// Generator pumps out UPIs
		var upiGenerator = function* (){
			var numDigits = 12;
			while (true) {
				var numbers = [];
				// This for loop is just 12 single digit numbers, so I feel like
				// its ok for it to be sync. 
				for (i = 0; i < numDigits; i++) {
					var number = Math.floor(Math.random() * 10);
					numbers.push(number);
				}
				yield(Number(numbers.join('')));
			}
		}();
		
		var User = models.user.model;
		
		// Curried function. Pass the callback to child function calls until a good
		// UPI holds up. In reality, there will likely never be a conflict.
		var upiUnique = function(upi,cb) {
			User.count({'upi':upi}, function(err, count) {
				if (err) {reject(err);}
				if (count != 0) {
					console.debug("Amazing, a duplicate ID was generated!", upi)
					upiUnique(upiGenerator.next().value,cb);
				} else {
					cb(null, upi);
				}
			})
		}
		// Here's the actual "do work" call
		upiUnique(upiGenerator.next().value, function(err, upi) {
			user['upi'] = upi;
			resolve(user);
		})
	});
}

// Create promise chain to hash a user's raw password. Used during user creation.
function hashUserPassword(user) {
	return new Promise(function(resolve, reject) {
		bcrypt.hash(user['password'], null, null, function(err, hash) {
			if (err) {
				console.error("Failed to hash a password", err)
				reject(err);
			} else {
				user['password'] = hash;
				resolve(user)
			}
		})
	})
}

// Sets a user._verified to true. 
// Since this is clicked in email (and assumed to be unique), we can 
// ignore auth *finger's crossed*
function verifyHashedUpi(req, res, next) {
	var hash = req.params.hash;
	var decodedUpi = lib.encryption.decrypt(hash);
	return new Promise(function(resolve, reject) {
		var User = models.user.model;
		var user = User.findOneAndUpdate({"upi":decodedUpi}, {$set: {'_verified': true}}, function(err, user) {
			if (err) {reject(err);}
			if (user == null) {
				// boolean false
				reject(false);
			} else {
				resolve(user);
			}
		});
		
	})
	.then(function(user) {
		res.locals.user = user;
		next();
	})
	.catch(function(err) {
		if (err == false) {
			// False is probably "couldnt find the upi"
			err = new Error('Invalid Email Link.');
			err.scope = 'lswrpg';
			err.name = 'UserError';
			err.statusCode = 401;
			err.error = {
				"message": err.message,
				"request": {
					"verificationCode": hash,
				}
			}
		}
		next(err);
	})
}


module.exports = {
	validateUser: validateUser,
	getUser: getUser,
	userAuthenticate: userAuthenticate,
	createUser: createUser,
	disableUser: disableUser,
	verifyHashedUpi: verifyHashedUpi
}


