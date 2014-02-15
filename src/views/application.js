this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.View = this.DataExplorer.View || {};

(function(my) {
"use strict";
// This is the top-level piece of UI.

my.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click a.logout': '_logout',
    'click a.login': '_login'
  },

  _logout: function() {
    DataExplorer.Model.logout();
    window.location.reload();
    return false;
  },

  _login: function(e) {
    e.preventDefault();
    var url = 'https://github.com/login/oauth/authorize?client_id=' + DataExplorer.app.config.oauth_client_id + '&scope=repo, user, gist';
    window.open(url, 'Data Explorer - GitHub Login', 'height=750,width=1000');
  },

  // Initialize
  // ----------

  initialize: function () {
    var self = this;
    _.bindAll(this);
    this.router = new Backbone.Router();
    this.projectList = new DataExplorer.Model.ProjectList();
    this.authenticated = false;

    this.router.route('', 'home', function() {
      // special case - we have project config in the query string
      var state = recline.View.parseQueryString(decodeURIComponent(window.location.search));
      if (state.backend) {
        var project = new DataExplorer.Model.Project({datasets: [state]});
        // project.save();
        self.onLoadProject(project);
        return;
      }
      // normal case
      if (self.authenticated) {
        self.router.navigate('dashboard', {trigger: true});
      } else {
        self.router.navigate('about', {trigger: true});
      }
    });
    this.router.route('about', 'about', function() {
      self.switchView('about');
    });
    this.router.route('dashboard', 'dashboard', function() {
      self.switchView('dashboard');
    });
    this.router.route('load', 'load', function() {
      self.switchView('load');
    });
    this.router.route('save', 'save', function() {
      self.switchView('save');
    });
    // project
    this.router.route(':username/:projectId', 'project', this.projectShow);
    this.router.route(':username/:projectId/view/:viewId', 'projectWithView', this.projectShow);
  },

  // Should be rendered just once
  render: function () {
    var self = this;
    // we will override if logged in
    this.$el.find('.user-status').addClass('logged-out');

    if ($.cookie("oauth-token")) {
      this.finishUserSetup();
    }

    // now append views
    this.dashboardView = new DataExplorer.View.Dashboard({
      collection: this.projectList
    });
    this.dashboardView.render();
    $('#main').append(this.dashboardView.el);
    this.dashboardView.bind('load', this.onLoadProject);

    this.loadView = new DataExplorer.View.Load({});
    this.loadView.render();
    $('#main').append(this.loadView.el);

    this.loadView.bind('load', this.onLoadProject);

    return this;
  },

  // Helpers
  // -------

  switchView: function(name, path) {
    $('body').removeClass().addClass('current-view '+name);
    $('#main .view').hide();
    $('#main .view.' + name).show();
    if (this.currentProject) {
      this.currentProject.remove();
      this.currentProject = undefined;
    }
    if (path) {
      this.router.navigate(path);
    } else {
      this.router.navigate(name);
    }
    this._setTitle(name);
  },

  _setTitle: function(title) {
    title = title[0].toUpperCase() + title.slice(1);
    document.title = title + ' - Open Knowledge Foundation Data Explorer';
  },

  finishUserSetup: function() {
    var self = this;
    self.username = $.cookie('username');
    self.$el.find('.user-status').removeClass('logged-out');
    self.$el.find('.user-status .username').text(self.username);
    self.authenticated = true;
    window.authenticated = true;
    this.projectList.load();
  },

  onLoadProject: function(project) {
    this.projectList.add(project);
    this.projectShow('project', project.id);
  },

  // Main Views
  // ----------

  _loadProject: function(username, projectId, cb) {
    var self = this;
    if (username == 'project') {
      var project = this.projectList.get(projectId);
      checkDatasetLoaded(project);
    } else {

      // First check if it's in our projectList
      var project = this.projectList.find(function (project) {
        return project.gist_id === projectId;
      });

      if (project) {
        checkDatasetLoaded(project);
        return;
      }

      // If not, read from gist
      var gist = DataExplorer.Model.github().getGist(projectId);
      gist.read(function(err, gist) {
        var project = DataExplorer.Model.unserializeProject(gist);
        project.currentUserIsOwner = (self.username === gist.user.login);
        checkDatasetLoaded(project);
      });
    }

    function checkDatasetLoaded(project) {
      // if we not yet have data loaded, load it now ...
      if (project.datasets.at(0).recordCount === null) {
        project.loadSourceDataset(function(err) { cb(err, project); });
      } else {
        cb(null, project);
      }
    }
  },

  // ### projectShow
  //
  // The router for showing a project
  projectShow: function(username, projectId, viewId) {
    var self = this;
    self.switchView('project', username + '/' + projectId);
    self.showProcessing('Loading');
    var projectViewState = {};
    if (viewId) {
      projectViewState.currentView = viewId;
    }
    this._loadProject(username, projectId, displayIt);
    function displayIt(err, project) {
      // housekeeping
      self._setTitle(project.get('name'));

      // if this project does in fact have remote backing let's set the username so it is sharable
      // we only want to do this where this is a "local" project url (i.e. one using local id stuff)
      if (username === 'project' && self.username && project.gist_id) {
        self.router.navigate(
          self.username + '/' + project.gist_id,
          {replace: true}
          );
      }

      if (err) {
        // this.notify('error', 'The requested resource could not be found.');
        console.log('We were unable to load the gist');
        return;
      }
      var ds = new DataExplorer.View.Project({
        model: project,
        state: projectViewState
      });

      $('#main').append(ds.el);
      ds.render();
      self.currentProject = ds;
      self.hideProcessing();
    }
  },

  notify: function(type, message) {
    $('#main').append(new DataExplorer.View.Notification(type, message).render().el);
  },

  showProcessing: function(msg) {
    if (msg) {
      $('.processing-notice span').text(msg);
    }
    $('.processing-notice').show();
  },

  hideProcessing: function(msg) {
    $('.processing-notice').hide();
    // reset it to original value
    $('.processing-notice span').text('Processing');
  },

  loaded: function() {
    $('#main .loading').remove();
  }

});

}(this.DataExplorer.View));
