const models = require('./models');
const controllers = require('./controllers');
const router = require('express').Router();
var validate = require('jsonschema').validate;
var format = require('json-format');
var Ajv = require('ajv')

var ajv = new Ajv({ useDefaults: true }); 
 
router.get('/schema.json', (req, res) => {
	//console.log(prettyjson.render(models.user.userSchema))
	//res.status(200).json(models.user.userSchema);
	res.set('Content-Type', 'application/json')
	res.status(200).send(format(models.user.schema))
});

router.get('/blue', (req, res) => {
  	res.status(200).json({ message: 'In Users Blue!' });
});


router.post('/', (req, res) => {
	var data = req.body;
	var schema = models.user.schema;
	valid = ajv.validate(schema, data)
	
	res.status(200).send(data)
});


module.exports = router;