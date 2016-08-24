var models = require('./models');

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
			console.log('Failed to compile schema. This is a bug.', schema);
			next(err);
		}
		validate(req.body)
		.then(function (valid) {
			console.log(req.body);
			next();
		})
		.catch(function (err) {
			if (!(err instanceof Ajv.ValidationError)) throw err;
			// data is invalid
			console.log('Validation errors:', err.errors);
			next();
		});
	})
}

// Generates a upi number (12 digit number)
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
	return upi.join('-');
}

// Create password hash
function hashPassword(password) {
	
}

module.exports = {
	validateUser: validateUser,
	generateUpi: generateUpi
}

