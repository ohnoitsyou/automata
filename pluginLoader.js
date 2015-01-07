var fs = require('fs')
  , q = require('q')
  , util = require('util')
  ;

var basepath = __dirname;

function pluginLoader(path) {
  _basepath = path;
  function getDirectories(path) {
    var d = q.defer();
    fs.readdir(path, function(err, files) {
      files = files.map(function(file) { return _basepath + "/" + file });
      files = files.filter(function(file) {
        return q.fcall(function(){
          return fs.statSync(file);
        })
        .then(function(stats) {
          return stats.isDirectory();
        });
      });
      return d.resolve(files)
    });
    return d.promise;
  }
  function filterValidPlugins(dirs) { 
    function _isValidPlugin(dir) {
      var d = q.defer();
      fs.open(dir + "/config.json",'r',function(err,data) {
        if(err) {
          return d.reject();
        } else {
          return d.resolve(dir);
        }
      });
      return d.promise;
    }
    return q.all(dirs.map(function(dir) {
      return _isValidPlugin(dir).then(function(dir) {
        return dir;
      },function(err) {
        return '';
      });
    })).then(function(dirs) {
      return dirs.filter(function(d) { return d.length > 0 });
    });
  }

  getDirectories(_basepath).then(filterValidPlugins).then(console.log);
  /*
  .then(function(results) {
    results.forEach(function(result) {
      console.log(result.state);
    });
  });
  */
}

pluginLoader(basepath + "/plugins");
