var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('api', { title: 'Automata',pluginDir: res.locals.pluginDir});
});

module.exports = router;
