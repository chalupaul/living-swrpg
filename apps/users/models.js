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
			"type": "string",
			"pattern": "^[0-9]{3}-[0-9]{3}-[0-9]{3}-[0-9]{3}",
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
		"firstName", "lastName", "emailAddress", "birthDate", "language", "loginName", "password", "homeRegion"
	]
}

module.exports = {
	user: {
		schema: UserSchema
	}
}