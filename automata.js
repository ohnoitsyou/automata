var app = require('espress')()
  , server = require('http').Server(app);
  , q = require('q'),
  , config = require('config')
  ;

var debug = false;


server.listen(4000);

app.use(express.static('bower_components'));

app.get('/', function(req, res) {
  res.send('Hello world');
});
