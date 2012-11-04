(function(config, models, views, routers, utils, templates) {

models.Project = Backbone.Model.extend({
  // data_source_url
  // data_source_type = github | gist | ckan | gdocs | ...
  // (?) data_source_file_type = csv

  // script_url

  // data_dest_url
  loadSourceDataset: function(datasetInfo, cb) {
    var self = this;
    this.set({source: datasetInfo});
    if (datasetInfo.backend == 'github') {
      self.loadGithubDataset(datasetInfo.url, cb);
    } else {
      self.dataset = new recline.Model.Dataset(datasetInfo);
      self.dataset.fetch().done(function() {
        cb();
      });
    }
  },

  loadGithubDataset: function(url, cb) {
    var self = this;
    user =  url.split("/")[3];
    repo = url.split("/")[4];
    branch = url.split("/")[6];

    var repo = getRepo(user, repo);

    repo.read(branch, 'data/data.csv', function(err, raw_csv) {
      self.dataset = new recline.Model.Dataset({data: raw_csv, backend: 'csv'});
      self.dataset.fetch();
      cb(err, self.dataset);
    });
  }
});

// Github stuff
// -------

// Gimme a Github object! Please.
function github() {
  return new Github({
    token: $.cookie('oauth-token'),
    username: $.cookie('username'),
    auth: "oauth"
  });
}

var currentRepo = {
  user: null,
  repo: null,
  instance: null
};

// Smart caching (needed for managing subsequent updates)
// -------

function getRepo(user, repo) {
  if (currentRepo.user === user && currentRepo.repo === repo) {
    return currentRepo.instance; // Cached
  }

  currentRepo = {
    user: user,
    repo: repo,
    instance: github().getRepo(user, repo)
  };

  return currentRepo.instance;
}


// Load Application
// -------
// 
// Load everything that's needed for the app + header

models.loadApplication = function(cb) {
  if (window.authenticated) {
    $.ajax({
      type: "GET",
      url: 'https://api.github.com/user',
      dataType: 'json',
      contentType: 'application/x-www-form-urlencoded',
      headers : { Authorization : 'token ' + $.cookie('oauth-token') },
      success: function(res) {
        $.cookie("avatar", res.avatar_url);
        $.cookie("username", res.login);
        app.username = res.login;

        var user = github().getUser();
        var owners = {};

        cb(null);

      },
      error: function(err) { 
        cb('error');
      }
    });

  } else {
    cb(null);
  }
}

// Authentication
// -------

models.authenticate = function() {
  if ($.cookie("oauth-token")) return window.authenticated = true;

  var match = window.location.href.match(/\?code=([a-z0-9]*)/);

  // Handle Code
  if (match) {
    $.getJSON(window.app.config.gatekeeper_url + '/authenticate/'+match[1], function(data) {
      $.cookie('oauth-token', data.token);
      window.authenticated = true;
      // Adjust URL
      var regex = new RegExp("\\?code="+match[1]);

      window.location.href = window.location.href.replace(regex, '').replace('&state=', '');
    });
    return false;
  } else {
    return true;  
  }
}

models.logout = function() {
  window.authenticated = false;
  $.cookie("oauth-token", null);
}

// Save Dataset
// -------

models.saveDataset = function(user, repo, branch, data, commitMessage, cb) {
  var repo = getRepo(user, repo);

  repo.write(branch, 'data/data.csv', data, commitMessage, function(err) {
    cb(err);
  });
}

}).apply(this, window.args);
