this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.Model = this.DataExplorer.Model || {};

(function(my) {
  "use strict";

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
      name: 'No name',
      readme: '',
      manifest_version: 1,
      state: 'active',
      created: new Date().toISOString(),
      sources: [],
      scripts: [
        {
          id: 'main.js',
          content: '// You can interact with your data here using the "dataset" variable,\n// which is a Recline memory store (http://reclinejs.com//docs/src/backend.memory.html).\n\nconsole.log(dataset);'
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
    };
  },

  initialize: function() {
    var self = this;
    this.currentUserIsOwner = true;
    this.last_modified = new Date();
    this.scripts = new Backbone.Collection();
    this.datasets = new Backbone.Collection();
    if (!this.id) {
      // generate a unique id with guard against duplication
      // there is some still small risk of a race condition if 2 apps doing this at the same time but we can live with it!
      var _generateId = function() {
        return 'dataexplorer-' + parseInt(Math.random() * 1000000, 10);
      };
      var _id = _generateId(); // TODO: Check in project list?
      this.set({id: _id});
    }
    this.scripts.reset(_.map(
      self.get('scripts'),
      function(scriptData) { return new my.Script(scriptData); }
    ));
    this.datasets.reset(_.map(
      self.get('datasets'),
      function(datasetData) { return new recline.Model.Dataset(datasetData); }
    ));
    this.scripts.bind('change', function() {
      self.set({scripts: self.scripts.toJSON()});
    });
    this.datasets.bind('change add', function() {
      self.set({datasets: self.datasets.toJSON()});
    });

    var saveMetadata = _.partial(this.saveToGist, false);
    this.bind('change:readme change:name change:views', saveMetadata, this);
    this.scripts.bind('change', saveMetadata, this);
  },

  saveToGist: function(saveDatasets) {
    // Persists the dataset to a gist, with the option to exclude the raw data.

    if (saveDatasets === undefined) saveDatasets = true;

    if (!window.authenticated || !this.currentUserIsOwner) return;

    var self = this;
    var gh = my.github();
    var gistJSON = my.serializeProject(this);
    var gist;

    if (saveDatasets) {
      _.each(this.get("datasets"), function (ds_meta, idx) {
        var ds = self.datasets.at(idx);
        var content = my.serializeDatasetToCSV(ds._store);
        gistJSON.files[ds_meta.path] = {"content": content || "# No data"};
      });
    }

    var deferred = new $.Deferred();

    if (this.gist_id) {
      gist = gh.getGist(this.gist_id);
      gist.update(gistJSON, function(err, gist) {
        if (err) {
          alert('Failed to save project to gist');
          console.log(err);
          console.log(gistJSON);
          deferred.reject();
        } else {
          console.log('Saved to gist successfully');
          deferred.resolve();
        }
      });
    } else {
      gistJSON.public = false;
      gist = gh.getGist();
      gist.create(gistJSON, function(err, gist) {
        if (err) {
          alert('Initial save of project to gist failed');
          console.log(err);
          console.log(gistJSON);
          deferred.reject();
        } else {
          self.gist_id = gist.id;
          self.gist_url = gist.url;
          self.last_modified = new Date();
          deferred.resolve();
        }
      });
    }
    return deferred;
  },

  trash: function () {
    this.set("state", "trash");
    this.saveToGist(false);
  },

  save: function() {
    // TODO: do not want to save *all* the time so should probably check and only save every 5m or something
    if (window.authenticated && this.currentUserIsOwner) {
      return this.saveToGist(true);
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
    var user =  url.split("/")[3];
    var repo = url.split("/")[4];
    var branch = url.split("/")[6];
    var path = url.split('/').slice(7).join('/');

    repo = getRepo(user, repo);

    repo.read(branch, path, function(err, raw_csv) {
      // TODO: need to do this properly ...
      self.datasets.reset([new recline.Model.Dataset({data: raw_csv, backend: 'csv'})]);
      cb(err, self.dataset);
    });
  },

  toJSON: function() {
    var out = Backbone.Model.prototype.toJSON.apply(this, arguments);
    // make sure we serialize fields
    // would like to do happen on model itself (i.e. change events on dataset objects trigger change in datasets attribute)
    // but not sure how to ensure it has happened reliably
    out.datasets = this.datasets.map(function(ds) {
      var dsjson = ds.toJSON();
      dsjson.fields = ds.fields.toJSON();
      return dsjson;
    });
    return out;
  }
});

// ### serializeProject
//
// Serialize a project to "Data Package" structure in line with the Data Package spec <http://www.dataprotocols.org/en/latest/data-packages.html>
//
// The specific JS structure shown here follows that of gists
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
//
// datapackage.json structure etc should be as defined in <http://www.dataprotocols.org/en/latest/data-packages.html>
//
// Implementation Note: one *must* ensure that content attribute of any file is
// non-empty to avoid mysterious errors of the form:
//
// <pre>
// {
//   "errors": [
//     {
//       "code": "missing_field",
//       "field": "files",
//       "resource": "Gist"
//     }
//   ],
//   "message": "Validation Failed"
// }
// </pre>
my.serializeProject = function(project) {
  // deep clone
  // we alter the data object below and toJSON in backbone is a shallow copy
  var data = $.extend(true, {}, project.toJSON());

  var description = data.name;
  if (data.readme) {
    description += ' - ' + data.readme.split('.')[0];
  }
  var gistJSON = {
    description: description,
    files: {
      'datapackage.json': {},
      'README.md': {
        // must ensure file content is non-empty - see note above
        content: data.readme || 'README is empty'
      }
    }
  };
  delete data.readme;

  // as per http://www.dataprotocols.org/en/latest/data-packages.html list of "datasets" is listed in resources attribute
  data.resources = data.datasets;
  delete data.datasets;

  _.each(data.scripts, function(script) {
    script.path = script.id;
    gistJSON.files[script.path] = {
      // must ensure file content is non-empty - see note above
      content: script.content || '// empty script'
    };
    delete script.content;
  });

  _.each(data.resources, function(dsInfo, idx) {
    // Make sure we don't persist inline data
    delete dsInfo.data;
    // conform to datapackage spec which has fields inside schema
    if (dsInfo.fields && dsInfo.fields.length > 0) {
      dsInfo.schema = {
        fields: dsInfo.fields
      };
      delete dsInfo.fields;
    }
  });

  gistJSON.files['datapackage.json'].content = JSON.stringify(data, null, 2);
  return gistJSON;
};

my.unserializeProject = function(serialized) {
  var dp = JSON.parse(serialized.files['datapackage.json'].content);

  // resources attribute lists data sources in data package spec
  // if statements for backwards compatibility
  if (dp.resources && !dp.datasets) {
    dp.datasets = dp.resources;
    delete dp.resources;
  } else if (dp.files && !dp.datasets) {
    dp.datasets = dp.files;
    delete dp.files;
  }

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
    // it is possible the path does not exist if there was no data
    if (ds.path) {
      if (ds.path in serialized.files) {
        ds.data = serialized.files[ds.path].content;
      } else {
        ds.data = '';
      }
    }
    if (ds.schema) {
      ds.fields = ds.schema.fields;
    }
  });

  // We don't want these anymore
  delete dp.gist_id;
  delete dp.gist_url;

  var project = new my.Project(dp);
  return project;
};

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
  comparator: function (a, b) {
    return b.last_modified - a.last_modified;
  },
  load: function() {
    var self = this;
    var gh = my.github();

    gh.getUser().gists(function (err, gists) {

      if (err) {
        alert("Failed to retrieve your gists");
        return;
      }

      // Only gists that contain datapackage.json
      gists = _.filter(gists, function (gist) {
        return "datapackage.json" in gist.files
      });

      _.each(gists, function (gist) {
        // We could do lazy loading, but for now lets get the datapackage immediately
        gh.getGist(gist.id).read(function (err, gist) {
          var dp = my.unserializeProject(gist);
          dp.gist_id = gist.id;
          dp.gist_url = gist.url;
          dp.last_modified = new Date(gist.updated_at);
          if (gist.fork_of) {
            dp.fork_of = {id: gist.fork_of.id, owner: gist.fork_of.user.login};
          }
          self.add(dp);
        });
      });

    });
  }
});

my.Script = Backbone.Model.extend({
  defaults: function() {
    return {
      created: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      language: 'javascript',
      content: ''
    };
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
};

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
};

// Authentication
// -------

my.logout = function() {
  window.authenticated = false;
  $.cookie("oauth-token", null);
};

// Save Dataset
// -------

my.saveDataset = function(user, repo, branch, data, commitMessage, cb) {
  repo = getRepo(user, repo);

  repo.write(branch, 'data/data.csv', data, commitMessage, function(err) {
    cb(err);
  });
};

}(this.DataExplorer.Model));
