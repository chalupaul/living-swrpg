var createMongooseSchema = require('json-schema-to-mongoose');
var mongoose = require('mongoose');
var async = require('async');

var UserSchema = {
	"$async": true,
	"$schema": "http://json-schema.org/draft-04/schema#",
	"id": "http://localhost:3000/users/schema.json",
	"title": "Living Star Wars User Object",
	"description": "Manages a user.",
	"type": "object",
	"properties": {
		"firstName": {
			"type": "string",
			"maxLength": 60,
			"description": "First Name",
		},
		"lastName": {
			"type": "string",
			"maxLength": 128,
			"description": "Last Name",
		},
		"emailAddress": {
			"type": "string",
			"format": "email",
			"description": "Email Address",
		},
		"upi": {
			"type": "number",
			"description": "12 digit unique player identifier",
		},
		"birthDate": {
			"type": "string",
			"format": "date",
			"description": "Your Date of Birth YYYY-MM-DD",
		},
		"language": {
			"enum": [
				"en",
				"es"
			],
			"default": "en",
			"description": "Language",
		},
		"loginName": {
			"type": "string",
			"maxLength": 24,
			"description": "Your login name",
		},
		"password": {
			"type": "string",
			"description": "Overloaded for both plain and hashed value of password",
		},
		"_verified": {
			"type": "boolean",
			"default": false,
			"description": "Signup complete, email verified."
		},
		"_adminDisabled": {
			"type": "boolean",
			"default": false,
			"description": "Account disabled."
		},
		"homeRegion": {
			"enum": [
				"northeast",
				"southeast",
				"central",
				"southcentral",
				"northwest",
				"southwest",
				"noncontinental"
			],
			"description": "Your home region",
		},
		"roles": {
			"type": "array",
			"minItems": 1,
			"description": "Your roles and entitlements.",
			"uniqueItems": true,
			"default": ["user"],
			"items": {
				"enum": [
					"emperor",
					"dark lord",
					"grand general",
					"grand admiral",
					"grand moff",
					"inquisitor",
					"moff",
					"admiral",
					"general",
					"gm",
					"stormtrooper",
					"captain",
					"user",
					"store owner"
				]
			}
		}
	},
	"required": [
		"firstName", "lastName", "emailAddress", "birthDate", "language", "loginName", "password", "homeRegion"
	]
}

var refs = {};

// Make sure you strip out internal fields that users aren't supposed to see
// Anything that starts with _ gets pulled out of the view. Doesn't change 
// the inside, this creates a pojo from a mongoose user model.
//
// This function is embedded inside User.methods
var getUserSafe = function(CallBack) {
	var safeReturn = {};
	var paths = this.schema.paths;
	var obj = this;
	async.each(
		Object.keys(paths), 
		function(pathName, callback) {
			publicVal = pathName.startsWith('_') ? false : true;
			if (publicVal) {
				// Rather than send the hash back to them (which has the seed),
				// strip it and send back '********'.
				var oldVal = (pathName == 'password') ? '********' : obj[pathName];
				safeReturn[pathName] = oldVal;
			}
			callback(null);
	}, function(err) {
		CallBack(err, safeReturn);
	});
};

var getModel = function() {
	var mongooseSchema = createMongooseSchema(refs, UserSchema);
	mongooseSchema.upi.index = true;
	mongooseSchema.loginName.index = true;
	var Schema = new mongoose.Schema(mongooseSchema);
	// load functions
	Schema.methods.getUserSafe = getUserSafe;
	return mongoose.model('User', Schema)
}


module.exports = {
	user: {
		schema: UserSchema,
		model: getModel()
	}
}