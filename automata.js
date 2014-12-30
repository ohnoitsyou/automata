var express = require('express')
  , hbs = require('hbs')
  , app = express()
  , server = require('http').Server(app)
  , q = require('q')
  , config = require('config')
  , broadway = require('broadway')
  ;

var debug = false;

server.listen(config.get('port'));
console.log('Listening on ' + config.get('port'));

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');
app.use(express.static('bower_components'));

app.get('/', function(req, res) {
  res.render('index');
});
