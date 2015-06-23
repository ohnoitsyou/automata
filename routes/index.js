var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('views/index', { title: 'Automata',pluginDir: res.locals.pluginDir});
});

module.exports = router;
