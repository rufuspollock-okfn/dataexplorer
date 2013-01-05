(function(config, models, views, routers, utils, templates) {

// The central object in the Data Explorer
//
// model
// {
//   source: datasetInfo // info needed load a dataset using recline
//   // does not exist yet
//   dest: 
//   ...
//   // save to gists
//   scripts: [ {...}, ... ]
// }
models.Project = Backbone.Model.extend({
  defaults: function() {
    return {
      manifest_version: 1,
      created: new Date().toISOString(),
      scripts: [
        {
          id: 'main.js',
          content: 'print("hello world")'
        }
      ]
    }
  },

  initialize: function() {
    var self = this;
    this.scripts = new Backbone.Collection();
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
    this.scripts.reset(_.map(
      self.get('scripts'),
      function(scriptData) { return new models.Script(scriptData) }
    ));
    this.scripts.bind('change', function() {self.save()});
    this.bind('change', this.save);
  },

  saveToStorage: function() {
    var data = this._toDataPackage();
    data.last_modified = new Date().toISOString();
    localStorage.setItem(this.id, JSON.stringify(data));
  },

  _toDataPackage: function() {
    var data = this.toJSON();
    data.scripts = this.scripts.toJSON();
    data.datasets = [];
    return data;
  },

  saveToGist: function() {
    var self = this;
    var gh = models.github();
    var gistJSON = {
      description: this.get('description'),
      files: {
        'datapackage.json': {
          'content': JSON.stringify(this._toDataPackage(), null, 2)
        }
      }
    };
    if (this.get('gist_id')) {
      var gist = gh.getGist(this.get('gist_id'));
      gist.update(gistJSON, function(err, gist) {
        if (err) {
          alert('Failed to save project to gist');
          console.log(err);
        } else {
          console.log('Saved to gist successfully');
        }
      });
    } else {
      gistJSON.public = true;
      var gist = gh.getGist();
      gist.create(gistJSON, function(err, gist) {
        if (err) {
          alert('Initial save of project to gist failed');
          console.log(err);
        } else {
          // we do not want to trigger an immediate resave to the gist
          self.set({gist_id: gist.id, gist_url: gist.url}, {silent: true});
          self.saveToStorage();
        }
      });
    }
  },

  save: function() {
    this.saveToStorage();
    // TODO: do not want to save *all* the time so should probably check and only save every 5m or something
    if (window.authenticated) {
      this.saveToGist();
    }
  },

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

models.Script = Backbone.Model.extend({
  defaults: function() {
    return {
      created: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      language: 'javascript',
      content: ''
    }
  }
});

// Github stuff
// -------

// Gimme a Github object! Please.
models.github = function() {
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
    instance: models.github().getRepo(user, repo)
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

      var user = models.github().getUser();
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
