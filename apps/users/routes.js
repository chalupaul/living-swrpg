var models = require('./models');
var controllers = require('./controllers');
var router = require('express').Router();
var lib = rootRequire('lib');
var format = require('json-format');

var logger = lib.logger.logger

 
router.get('/schema.json', (req, res) => {
	res.set('Content-Type', 'application/json')
	res.status(200).send(format(models.user.schema))
});

router.post('/', 
	controllers.validateUser, 
	controllers.createUser, 
	function(req, res) {
		res.status(200).json(res.locals.user);
	}
);

router.get('/:upi',
	controllers.getUser,
	function(req, res) {
		res.status(200).send(res.locals.user);
	}
)

router.post('/auth',
	controllers.userAuthenticate,
	function(req, res) {
		res.status(200).json({token: res.locals.token});
	}
)

router.get('/disable/:upi',
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
	controllers.disableUser,
	function(req, res) {
		res.status(200).json(res.locals.user);
	}
)

router.get('/verify/:hash',
	controllers.verifyHashedUpi,
	function(req, res, next) {
		res.status(200).json(res.locals.user);
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
