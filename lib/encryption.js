var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('./config');

var secret = config.server.tokenSecret ? config.server.tokenSecret : null;
var encryptAlgorithm = 'aes-256-ctr'

if (secret == null) {
	console.error("tokenSecret not set in config! Dieing for security reasons.");
	process.exit(1);
}

var options = {
	algorithm: 'HS256',
	issuer: 'paulpatine',
	audience: 'api',
	subject: 'user',
	expiresIn: '7d'	
}
function sign(payload, callback) {
	//callback should be function(err, token)
	jwt.sign(payload, secret, options, callback);
}

function verify(token, callback) {
	//callback should be function(err, decoded)
	jwt.verify(token, secret, options, callback);
	
}

// Decode a json web token object and save it at
// req.decodedToken. This is to be used in route middleware.
function jwtMiddleware(req, res, next) {
	return new Promise(function(resolve, reject) {
		if (req.get('Authorization') == undefined) {
			reject(new Error("Invalid authorization header"));
		}
		var hdr = req.get('Authorization').split(' ');
		if (hdr.length != 2 || (hdr[0].toLowerCase() != 'bearer')) {
			reject(new Error("Invalid authorization header"));
		} else {
			resolve(hdr[1]);
		}
	})
	.then(function(token) {
		return new Promise(function(resolve, reject) {
			verify(token, function(err, decoded) {
				if (err) {
					reject(new Error("Invalid authorization token"));
				} else {
					res.locals.decodedToken = decoded;
					next();
				}
			})
		})
	})
	.catch(function(err) {
		err.name = 'UnauthorizedError';
		err.scope = 'lswrpg';
		err.statusCode = 401;
		err.error = {
			"message": err.message,
			"request": {
				"token": req.get('Authorization')
			}
		}
		next(err);
	})
	
}

// Encrypts a text into a reversable hash. Used in email registration
function encrypt(text) {
	var cipher = crypto.createCipher(encryptAlgorithm, secret)
	var crypted = cipher.update(text,'utf8','hex')
	crypted += cipher.final('hex');
	return crypted;
}

// Decrypts a hash into the original value. Used in email registration
function decrypt(text) {
	var decipher = crypto.createDecipher(encryptAlgorithm, secret)
	var dec = decipher.update(text,'hex','utf8')
	dec += decipher.final('utf8');
	return dec;
}

module.exports = {
	sign: sign,
	verify: verify,
	jwtMiddleware: jwtMiddleware,
	encrypt: encrypt,
	decrypt: decrypt
}