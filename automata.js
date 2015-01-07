var fs = require('fs')
  , path = require('path')
  , express = require('express')
  , hbs = require('hbs')
  , app = express()
  , server = require('http').Server(app)
  , q = require('q')
  , config = require('config')
  , broadway = require('broadway')
  ;

var debug = false;

//getFolders(config.get('plugin_directory')).then(console.log);
pluginLoader(__dirname + "/" + config.get('plugin_directory') + "/");

server.listen(config.get('port'));
console.log('Listening on ' + config.get('port'));

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');
app.use(express.static('bower_components'));

app.get('/', function(req, res) {
  res.render('index');
});

function pluginLoader(path) {
  var basePath = path;

  function getFiles(path) {
    var deferred = q.defer();
    fs.readdir(path, function(err, files) {
      if(err) {
	deferred.reject(new Error(err));
      } else {
	deferred.resolve(files);
      }
    });
    return deferred.promise;
  }

  function filterFolders(files) {
    return q.fcall(function () {
      var dirs = [];
      files.forEach(function(file) {
	var stats = fs.statSync(path + file);
	if(stats.isDirectory()) {
	  dirs.push(path + file);
	}
      });
      return dirs;
    });
  }

  function hasConfig(path) {
    var deferred = q.defer();
    //console.log(path + "/config.json");
    fs.stat(path + "/config.json", function(err,stats) {
      if(err) {
        console.log('does not have config');
        deferred.reject('false');
      } else {
        console.log('has config');
        deferred.resolve(path + "/config.json");
      }
    });
    return deferred.promise;
  }

  function readConfig (path) {
    console.log('readConfig',path);
    var d = q.defer();
      fs.readFile(path, function(err, data) {
        if(err) {
          d.reject(err);
        } else {
          d.resolve(JSON.parse(data));
        }
      });
    return d.promise;
  }

  function getPluginConfig(folder) {
    return q.fcall(function() {
      var configs = []
      folder.forEach(function(folder) {
	console.log('checking',folder);
	hasConfig(folder).then(readConfig).then(function(config) {
	    configs.push({'path': path, 'config' : config});
	},function(err) {
	  console.log(err);
	});
      });
      return configs;
    });
  }

  var dirs = getFiles(path)
  .then(filterFolders)
  .then(getPluginConfig)
  .then(console.log);
  /*
  .then(function(folders) {
    var configs = [];
    folders.forEach(function(folder) {
      configs.push(hasConfig(folder));
    })
    return configs;
  })
  */
  //.then(console.log);

  //var deferred = q.defer();
}
