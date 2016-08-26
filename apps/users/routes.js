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

router.post('/', 
	controllers.validateUser, 
	controllers.createUser, 
	function(req, res) {
		res.status(200).json(req.body);
	}
);


router.use(function(err, req, res, next) {
	if (err.hasOwnProperty('scope') && err.scope == 'swrpg') {
		res.status(err.statusCode).json(err.error);
	} else {
		console.error(err);
		// Don't let users see anything they shouldn't.
		res.status(500).json({"message":"An unknown error has occured."})
	}
});


module.exports = router;