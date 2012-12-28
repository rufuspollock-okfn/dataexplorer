(function(config, models, views, routers, utils, templates) {

models.Project = Backbone.Model.extend({
  defaults: function() {
    return {
      project_version: 1,
      created: new Date().toISOString()
    }
  },

  initialize: function() {
    var self = this;
    if (!this.id) {
      // generate a unique id with guard against duplication
      // there is some still small risk of a race condition if 2 apps doing this at the same time but we can live with it!
      var _generateId = function() {
        return 'dataexplorer-' + parseInt(Math.random() * 1000000)
      };
      var _id = _generateId();
      while(_id in localStorage) {
        _id = _generateId();
      }
      this.set({id: _id});
    }
    this.bind('change', this.saveToStorage);
    this.saveToStorage();
  },

  saveToStorage: function() {
    var data = this.toJSON();
    data.last_modified = new Date().toISOString();
    localStorage.setItem(this.id, JSON.stringify(data));
  },

  // model
  // {
  //   source: datasetInfo // info needed load a dataset using recline
  //   // does not exist yet
  //   dest: 
  //   ...
  //   // save to gist
  //   transformScript: 
  // }
  // data_source_url
  // data_source_type = github | gist | ckan | gdocs | ...
  // (?) data_source_file_type = csv
  // script_url
  // data_dest_url

  // load source dataset info
  loadSourceDataset: function(cb) {
    var self = this;
    var datasetInfo = self.get('source');
    if (datasetInfo.backend == 'github') {
      self.loadGithubDataset(datasetInfo.url, cb);
    } else {
      self.dataset = new recline.Model.Dataset(datasetInfo);
      self.dataset.fetch().done(function() {
        // TODO: should we set dataset metadata onto project source?
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

models.ProjectList = Backbone.Collection.extend({
  model: models.Project,
  load: function() {
    for(key in localStorage) {
      if (key.indexOf('dataexplorer-') == 0) {
        var projectInfo = localStorage.getItem(key);
        try {
          var data = JSON.parse(projectInfo);
          var tmp = new models.Project(data);
          this.add(tmp);
        } catch(e) {
          alert('Failed to load project ' + projectInfo);
        }
      }
    }
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

models.loadUserInfo = function(cb) {
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
}

// Authentication
// -------

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
