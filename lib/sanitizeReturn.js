var async = require('async');
// Make sure you strip out internal fields that users aren't supposed to see
// Anything that starts with _ gets pulled out of the view. Doesn't change 
// the inside, this creates a pojo from a mongoose user model.
function sanitize(obj, callBack) {
	var safeReturn = {};
	var paths = obj.schema.paths;
	async.each(
		Object.keys(paths), 
		function(pathName, callback) {
			publicVal = pathName.startsWith('_') ? false : true;
			if (publicVal) {
				// Rather than send the hash back to them (which has the seed),
				// strip it and send back '********'.
				var oldVal = (pathName == 'password') ? '********' : obj[pathName];
				safeReturn[pathName] = oldVal;
			}
			callback(null);
	}, function(err) {
		callBack(err, safeReturn);
	});
}

module.exports = sanitize;