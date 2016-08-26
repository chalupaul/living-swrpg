var models = require('./models');
var util = rootRequire('util');

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
			err.scope = 'swrpg';
			err.statusCode = 400;
			err.error = err.errors[0];
			return next(err);
		});
	})
}


// Create user objects and persist them in the database.
function createUser(req, res, next) {
	return new Promise(function(resolve, reject) {
		resolve(req.body)
	})
	.then(hashUserPassword)
	.then(function(user) {
		user['upi'] = generateUpi()[0];
		return(user);
	}).then(function(user) {
		req.body = user;
		next();
	}).catch(function(err) {
		next(err);
	})
	// TODO: save to db
}

// Generates a upi number (12 digit number).
// Returns 2 forms in an array the first value is the int
// thta is generated, the second value is a - seperated list
// like 123-456-789-012
function generateUpi() {
	var numDigits = 12;
	var numbers = new Array(numDigits);
	var randomIntInc = function(low, high) {
	    return Math.floor(Math.random() * (high - low + 1) + low);
	}
	for (var i = 0; i < numbers.length; i++) {
	    numbers[i] = randomIntInc(1,9);
	}
	var makeSlice = function(idx, original, result) {
		if (idx >= numDigits) return result;
		current = numbers.slice(idx, idx+3).join('');
		result.push(current);
		return makeSlice(idx+3, original, result);
	}
	upi = makeSlice(0, numbers, []);
	return [parseInt(numbers.join('')), upi.join('-')];
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

// Returns a promise with a boolean if an entered password matches a hash.
function matchPassword(password, hash) {
	return new Promise(function(resolve, reject) {
		bcrypt.compare(password, hash, function(err, res) {
			if (res) {
				resolve(res);
			} else {
				// TODO: make this throw a bad password error
				reject(res);
			}
		})
	})
}

module.exports = {
	validateUser: validateUser,
	createUser: createUser
}

