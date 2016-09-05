var models = require('./models');
var controllers = require('./controllers');
var router = require('express').Router();
var lib = rootRequire('lib');
var format = require('json-format');

var logger = lib.logger.logger

 
router.get('/schema.json', (req, res) => {
	res.set('Content-Type', 'application/json')
	res.status(200).send(format(models.adventure.schema))
});

module.exports = router;