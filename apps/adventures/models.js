var createMongooseSchema = require('json-schema-to-mongoose');
var mongoose = require('mongoose');
var async = require('async');
var lib = rootRequire('lib');


var AdventureSchema = {
	"$async": true,
	"$schema": "http://json-schema.org/draft-04/schema#",
	"id": lib.config.server.siteUrl + "/adventures/schema.json",
	"title": "Living Star Wars User Object",
	"description": "Manages an adventure.",
	"type": "object",
	"properties": {
		"name": {
			"type": "string",
			"maxLength": 140,
			"description": "Adventure Name",
		},
		"author": {
			"type": "number",
			"description": "Author's UPI number"
		},
		"season": {
			"enum": lib.staticData.seasons.map(function(a) {return a.name;}),
			"description": "Season name"
		},
		"summary": {
			"type": "string",
			"maxLength": 2500,
			"description": "A description of the adventure"
		},
		"summaryBrief": {
			"type": "string",
			"maxLength": 140,
			"description": "A tweet sized description of the adventure"
		},
		"region": {
			"enum": lib.staticData.regions,
			"description": "Region that this adventure takes place in. Must match author's region."
		},
		"pdfUrl": {
			"type": "string",
			"description": "URL to download the adventure in PDF format"
		},
		"_published": {
			"type": "boolean",
			"description": "Flag to toggle visibility/availability of adventure",
			"default": false
		},
		"_sepcialMission": {
			"type": "boolean",
			"description": "Inquisitors and above can have special missions that only they can GM",
			"default": false
		}
	},
	"required": [
		"name", "author", "season", "summary", "summaryBrief", "region", "pdfUrl", 
	]
}

var refs = {};


var getModel = function() {
	var mongooseSchema = createMongooseSchema(refs, AdventureSchema);
	var Schema = new mongoose.Schema(mongooseSchema);
	return mongoose.model('Adventure', Schema)
}

module.exports = {
	adventure: {
		schema: AdventureSchema,
		model: getModel()
	}
}