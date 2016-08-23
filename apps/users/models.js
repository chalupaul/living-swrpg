var UserModel = {}
var UserSchema = {
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
			"maximum": 999999999999,
			"minimum": 111111111111,
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
		"passwordHash": {
			"type": "string",
			"description": "Hashed value of password",
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
			"uniqueItems": true,
			"default": ["user"],
			"items": {
				"enum": [
					"emperor",
					"user",
					"gm",
					"organizer",
					"writer",
					"storeOwner",
					"regionalCoordinator"
				]
			}
		}
	},
	"required": [
		"firstName", "lastName", "emailAddress", "upi", "birthDate", "language", "loginName", "passwordHash", "homeRegion"
	]
}

module.exports = {
	user: {
		schema: UserSchema,
		model: UserModel
	}
}