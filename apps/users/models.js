var createMongooseSchema = require('json-schema-to-mongoose');
var mongoose = require('mongoose');
var async = require('async');
var lib= rootRequire('lib');

var UserSchema = {
	"$async": true,
	"$schema": "http://json-schema.org/draft-04/schema#",
	"id": lib.config.server.siteUrl + "/users/schema.json",
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
			"enum": lib.staticData.languages,
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
			"enum": lib.staticData.regions,
			"description": "Your home region",
		},
		"roles": {
			"type": "array",
			"minItems": 1,
			"description": "Your roles and entitlements.",
			"uniqueItems": true,
			"default": ["player"],
			"items": {
				"enum": lib.staticData.roles
			}
		}
	},
	"required": [
		"firstName", "lastName", "emailAddress", "birthDate", "language", "loginName", "password", "homeRegion"
	]
}

var refs = {};

var getModel = function() {
	var mongooseSchema = createMongooseSchema(refs, UserSchema);
	mongooseSchema.upi.index = true;
	mongooseSchema.loginName.index = true;
	var Schema = new mongoose.Schema(mongooseSchema);
	return mongoose.model('User', Schema)
}


module.exports = {
	user: {
		schema: UserSchema,
		model: getModel()
	}
}