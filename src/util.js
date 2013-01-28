this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.Util = {};

(function(my) {

my.loadData = function(options, callback) {
  if(typeof options === 'string')
    options = {'url':options};
  else
    options = JSON.parse(JSON.stringify(options)); // Use a duplicate for mutating.

  if (
    options.url.indexOf('https://github.com')!=-1
    ||
    options.url.indexOf('http://github.com')!=-1
    ) {
    my.loadGithubFile(options.url, callback)
  } else {
    recline.Backend.DataProxy.fetch(options)
      .done(function(data) {
          callback(null, data);
        })
      .fail(function(err) {
        callback(err, null);
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
