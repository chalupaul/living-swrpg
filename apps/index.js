// Exports everyhting in this directory
require('fs').readdirSync(__dirname + '/').forEach(function(file) {
  if (file !== 'index.js') {
    var name = file.replace('.js', '');
    exports[name] = require('./' + file);
  }
});