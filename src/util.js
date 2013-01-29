this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.Util = {};

(function(my) {

my.loadData = function(options, callback) {
  if(typeof options === 'string')
    options = {'url':options};
  else
    options = JSON.parse(JSON.stringify(options)); // Use a duplicate for mutating.

  if (
    options.url.indexOf('https://github.com')==0
    ||
    options.url.indexOf('http://github.com')==0
    ) {
    my.loadGithubFile(options.url, callback)
  } else {
    var url = 'http://jsonpdataproxy.appspot.com/?format=json&max-results=500000&url=' + options.url;
    request.get(url, function(err, res, body) {
      callback(err, body);
    });
  }
}

my.loadGithubFile = function(url, cb) {
  var gh = new Github({}),
    user =  url.split("/")[3],
    repo = url.split("/")[4],
    branch = url.split("/")[6],
    path = url.split('/').slice(7).join('/')
      ;

  var repo = gh.getRepo(user, repo);

  repo.read(branch, path, function(err, fileData) {
    cb(err, fileData);
  });
}

var types = {
}

})(DataExplorer.Util);
