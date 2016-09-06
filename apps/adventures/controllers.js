var models = require('./models');
var User = rootRequire('apps/users').models.user.model;
var async = require('async');
var lib = rootRequire('lib');

function loadSchema(uri, callback) {
    request.json(uri, function(err, res, body) {
        if (err || res.statusCode >= 400)
            callback(err || new Error('Loading error: ' + res.statusCode));
        else
            callback(null, body);
    });
}

// Validates adventure objects against json schema. Note: This doesn't create uuids or things like that.
function validateAdventure(req, res, next) {
	var schema = models.adventure.schema;

	ajv.compileAsync(schema, function (err, validate) {
		if (err) {
			console.error('Failed to compile schema. This is a bug.', schema);
			return next(err);
		}
		validate(req.body)
		.then(function (valid) {
			return new Promise(function(resolve, reject) {
				User.count({'upi': req.body.author}, function(err, count) {
					if (err || count == 0) {
						reject(new Error('Author UPI not found.'));
					} else {
						resolve(valid);
					}
				});
			})
		})
		.then(function(valid) {
			next();
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

function createAdventure(req, res, next) {
	return new Promise(function(resolve, reject) {
		// pop off new adventure
		resolve(req.body)
	})
	.then(function(adventure) {
		var Adventure = models.adventure.model;
	})
}