var async = require('async');

function authzMiddleware(req, res, next) {
	var requiredRoles = res.locals.requiredRoles ? res.locals.requiredRoles : new Array();
	if (requiredRoles.length == 0) {
		// fall through in case the router doesn't have any specified roles
		next();
	} else {
		// Sith privilege.
		if (requiredRoles.indexOf('emperor') == -1) {
			requiredRoles.push('emperor');
		}
		// We just make sure the user has at least 1 role in the "can do" list.
		var roles = res.locals.decodedToken['roles'];
		console.log(roles);
		async.any(
			roles,
			function(role, callback){
				var truthity = requiredRoles.indexOf(role) != -1;
				callback(null, truthity);
			},
			function(err, result){
				if (err) {
					next(err);
				} else if (result == false) {
					err = new Error('Insufficient permissions.');
					err.name = "ForbiddenError";
					err.scope = "swrpg";
					err.statusCode = 403;
					err.error = {
						"message": err.message,
						"request": {
							"urlPath": req.originalUrl
						}
					}
					next(err);
				} else {
					next();
				}
			}
		);	
	}
}

module.exports = {
	authzMiddleware: authzMiddleware
}