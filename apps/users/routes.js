var models = require('./models');
var controllers = require('./controllers');
var router = require('express').Router();
var util = rootRequire('util');
var validate = require('jsonschema').validate;
var format = require('json-format');
var Ajv = require('ajv')

var ajv = new Ajv({ useDefaults: true }); 
var logger = util.logger.logger

 
router.get('/schema.json', (req, res) => {
	res.set('Content-Type', 'application/json')
	res.status(200).send(format(models.user.schema))
});

router.get('/blue', (req, res) => {
  	res.status(200).json({ message: 'In Users Blue!' });
});



router.post('/', controllers.validateUser, function(req, res) {
	var numbers = new Array(10);
	for (var i = 0; i < numbers.length; i++) {
	    numbers[i] = controllers.generateUpi()
	}
	res.status(200).send({"numbers": numbers})
});


module.exports = router;