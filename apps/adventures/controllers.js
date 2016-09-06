var Ajv = require('ajv');
var uuid = require('node-uuid');
var ajv = new Ajv({ useDefaults: true, loadSchema: loadSchema });
var async = require('async');
var lib = rootRequire('lib');
var models = require('./models');
var User = rootRequire('apps/users').models.user.model;

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

function getAdventure(req, res, next) {
	console.log("HIT HERE");
	return new Promise(function(resolve, reject) {
		console.log("INSIDE PROMISE");
		var uuid = req.params.uuid;
		var Adventure = models.adventure.model;
		Adventure.findOne({"uuid":uuid}, function(err, adv) {
			console.log(adv)
			if (err) {reject(err);}
			if (adv == null) {
				err = new Error('Adventure ID not found.');
				err.name = 'AdventureError';
				err.statusCode = 404;
				err.scope= 'lswrpg';
				err.error = {
					"request": {
						"uuid": uuid
					},
					"message": err.message
				}
				reject(err);
			}
			resolve(adv);
		})
	})
	.then(function(adventure) {
		lib.sanitizeReturn(adventure, function(err, safeVals) {
			res.locals.adventure = safeVals;
			next();
		});
	})
	.catch(function(err) {
		next(err);
	})
}

function createAdventure(req, res, next) {
	new Promise(function(resolve, reject) {
		// pop off new adventure
		resolve(req.body)
	})
	.then(function(adventure) {
		return new Promise(function(resolve, reject) {
			var Adventure = models.adventure.model;
			var a = new Adventure(adventure);
			a.uuid = uuid.v4();
			a.save(function(error, object, numAffected) {
				if (error) {
					reject(error);
				} else {
					resolve(object);
				}
			})
		})
	})
	.then(function(adventure) {
		lib.sanitizeReturn(adventure, function(err, safeVals) {
			res.locals.adventure = safeVals;
			next();
		});
	})
	.catch(function(err) {
		next(err);
	});
}

module.exports = {
	validateAdventure: validateAdventure,
	createAdventure: createAdventure,
	getAdventure: getAdventure
}