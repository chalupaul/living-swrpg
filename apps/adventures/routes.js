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

router.post('/',
	lib.encryption.jwtMiddleware,
	function(req, res, next) {
		res.locals.requiredRoles = [
			'emperor',
			'dark lord',
			'grand general',
			'grand moff',
			'grand admiral',
			'inquisitor'
		];
		next();
	},
	lib.rbac.authzMiddleware,
	controllers.validateAdventure, 
	controllers.createAdventure, 
	function(req, res) {
		res.status(200).json(res.locals.adventure);
	}
);

router.get('/:uuid',
	lib.encryption.jwtMiddleware,
	function(req, res, next) {
		// Any role will do, just need to be authenticated
		res.locals.requiredRoles = lib.staticData.roles;
		next();
	},
	lib.rbac.authzMiddleware,
	controllers.getAdventure,
	function(req, res) {
		res.status(200).json(res.locals.adventure);
//		res.status(200).json({"hi"})
	}
)

router.use(function(err, req, res, next) {
	if (err.hasOwnProperty('scope') && err.scope == 'lswrpg') {
		res.status(err.statusCode).json(err.error);
	} else {
		console.error(err);
		// Don't let users see anything they shouldn't.
		res.status(500).json({"message":"An unknown error has occured."})
	}
});

module.exports = router;