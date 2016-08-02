const models = require('./models');
const controllers = require('./controllers');
const routes = require('express').Router();

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'In Auth Routes!' });
});

routes.get('/blue', (req, res) => {
  res.status(200).json({ message: 'In Auth Blue!' });
});

routes.get('/trump', controllers.trump);


module.exports = routes;