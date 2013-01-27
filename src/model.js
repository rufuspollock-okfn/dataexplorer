this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.Model = this.DataExplorer.Model || {};

(function(my) {

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
my.Project = Backbone.Model.extend({
  defaults: function() {
    return {
      name: '',
      readme: '',
      manifest_version: 1,
      created: new Date().toISOString(),
      scripts: [
        {
          id: 'main.js',
          content: 'print("hello world")'
        }
      ],
      datasets: [],
      views: [
        {
          id: 'grid',
          label: 'Grid',
          // must be in recline.View namespace for the present
          type: 'SlickGrid'
        },
        {
          id: 'graph',
          label: 'Graph',
          type: 'Graph'
        },
        {
          id: 'map',
          label: 'Map',
          type: 'Map'
        }
      ]
    }
  },

  initialize: function() {
    var self = this;
    this.scripts = new Backbone.Collection();
    this.datasets = new Backbone.Collection();
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
      function(scriptData) { return new my.Script(scriptData) }
    ));
    this.datasets.reset(_.map(
      self.get('datasets'),
      function(datasetData) { return new recline.Model.Dataset(datasetData) }
    ));
    this.scripts.bind('change', function() {
      self.set({scripts: self.scripts.toJSON()});
    });
    this.datasets.bind('change', function() {
      self.set({datasets: self.datasets.toJSON()});
    });
    this.bind('change', this.save);
  },

  saveToStorage: function() {
    var data = this.toJSON();
    data.last_modified = new Date().toISOString();
    localStorage.setItem(this.id, JSON.stringify(data));
  },

  saveToGist: function() {
    var self = this;
    var gh = my.github();
    var gistJSON = my.serializeProject(this);

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
      gistJSON.public = false;
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
    var datasetInfo = self.datasets.at(0).toJSON();
    if (datasetInfo.backend == 'github') {
      self.loadGithubDataset(datasetInfo.url, function(err, whocares) {
        self.datasets.at(0).fetch().done(function() {
          cb(null, self);
        });
      });
    } else {
      self.datasets.at(0).fetch().done(function() {
        // TODO: should we set dataset metadata onto project source?
        cb(null, self);
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
      // TODO: need to do this properly ...
      self.datasets.reset([new recline.Model.Dataset({data: raw_csv, backend: 'csv'})]);
      cb(err, self.dataset);
    });
  }
});

// ### serializeProject
//
// Serialize a project to "Data Package" structure. The specific JS structure shown here follows that of gists
//
// <pre>
// {
//    // optional
//    description
//    files: {
//      'datapackage.json': {
//        content: ... 
//      },
//      'filename': ...
//    }
// }
// </pre>
my.serializeProject = function(project) {
  var data = project.toJSON();

  var gistJSON = {
    description: project.get('description'),
    files: {
      'datapackage.json': {
      }
    }
  };

  gistJSON.files['README.md'] = { content: data.readme };
  delete data.readme;

  _.each(data.scripts, function(script) {
    script.path = 'scripts/' + script.id;
    gistJSON.files[script.path] = {
      content: script.content
    };
    delete script.content;
  });

  _.each(data.datasets, function(dsInfo, idx) {
    // TODO: check dsInfo.path does not over-write anything important (e.g. datapackage.json ...)
    if (dsInfo.path) {
      var ds = project.datasets.at(idx);
      gistJSON.files[dsInfo.path] = {
        content: my.serializeDatasetToCSV(ds._store)
      }
      // for good measure remove any data attribute
      // TODO: should this be done when we loaded from the data and moved it into the dataset data store
      delete dsInfo.data;
    }
  });

  gistJSON.files['datapackage.json'].content = JSON.stringify(data, null, 2)
  return gistJSON;
};

my.unserializeProject = function(serialized) {
  var dp = JSON.parse(serialized.files['datapackage.json'].content);
  if ('README.md' in serialized.files) {
    dp.readme = serialized.files['README.md'].content;
  }
  _.each(dp.scripts, function(script) {
    // we could be more careful ...
    // if (script.path && _.has(serialized.files, script.path)) {
    if (script.path) {
      script.content = serialized.files[script.path].content;
    }
  });
  _.each(dp.datasets, function(ds) {
    if (ds.path) {
      ds.data = serialized.files[ds.path].content;
    }
  });
  var project = new my.Project(dp);
  return project;
}

// TODO: move to util?
my.serializeDatasetToCSV = function(dataset) {
  var records = [];
  records.push(_.pluck(dataset.fields, 'id'));
  _.each(dataset.records, function(record, index) {
    var tmp = _.map(dataset.fields, function(field) {
      return record[field.id];
    });
    records.push(tmp);
  });
  return recline.Backend.CSV.serializeCSV(records);
};


my.ProjectList = Backbone.Collection.extend({
  model: my.Project,
  load: function() {
    for(key in localStorage) {
      if (key.indexOf('dataexplorer-') == 0) {
        var projectInfo = localStorage.getItem(key);
        try {
          var data = JSON.parse(projectInfo);
          var tmp = new my.Project(data);
          this.add(tmp);
        } catch(e) {
          alert('Failed to load project ' + projectInfo);
        }
      }
    }
  }
});

my.Script = Backbone.Model.extend({
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
my.github = function() {
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
    instance: my.github().getRepo(user, repo)
  };

  return currentRepo.instance;
}


// Load Application
// -------
// 
// Load everything that's needed for the app + header

my.loadUserInfo = function(cb) {
  $.ajax({
    type: "GET",
    url: 'https://api.github.com/user',
    dataType: 'json',
    contentType: 'application/x-www-form-urlencoded',
    headers : { Authorization : 'token ' + $.cookie('oauth-token') },
    success: function(res) {
      $.cookie("avatar", res.avatar_url);
      $.cookie("username", res.login);
      DataExplorer.app.username = res.login;

      var user = my.github().getUser();
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

my.logout = function() {
  window.authenticated = false;
  $.cookie("oauth-token", null);
}

// Save Dataset
// -------

my.saveDataset = function(user, repo, branch, data, commitMessage, cb) {
  var repo = getRepo(user, repo);

  repo.write(branch, 'data/data.csv', data, commitMessage, function(err) {
    cb(err);
  });
}

}(this.DataExplorer.Model));
