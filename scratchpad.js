var express = require('express');
var app = express();
var debug = require('debug')('scratch');

var router1 = express.Router();
var router2 = express.Router();
var router3 = express.Router();

router3.get('/devices', function(req, res) {
   res.send('devices');
});

router2.use('/spark',router3);
router2.get('/spark',function(req, res) {
  res.send('/spark');
});

/*
router1.use('/api',router2);
router1.get('/api', function(req, res) {
  res.send('/api');
});
*/

app.use('/',router1);
app.get('/', function(req, res) { 
  res.send('/');
});

debug('app',router1.stack);

module.exports = app;
