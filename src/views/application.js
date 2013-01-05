(function(config, models, views, routers, utils, templates) {

// This is the top-level piece of UI.

views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click a.logout': '_logout',
    'click a.login': '_login'
  },

  _logout: function() {
    models.logout();
    window.location.reload();
    return false;
  },

  _login: function(e) {
    e.preventDefault();
    var url = 'https://github.com/login/oauth/authorize?client_id=' + config.oauth_client_id + '&scope=repo, user, gist';
    window.open(url, 'Data Explorer - Github Login', 'height=750,width=1000');
  },

  // Initialize
  // ----------

  initialize: function () {
    var self = this;
    this.el = $(this.el);
    _.bindAll(this);
    this.router = new Backbone.Router();
    this.projectList = new models.ProjectList();
    this.projectList.load();

    // TODO: make this somewhat nicer - e.g. show a loading message etc
    var state = recline.View.parseQueryString(decodeURIComponent(window.location.search));
    if (state.backend) {
      var project = new models.Project({source: state});
      project.loadSourceDataset(function(err) {
        if (err) {
          // this.notify('error', 'The requested resource could not be found.');
        } else {
          project.save();
          self.onLoadProject(project);
        }
      });
    }
    
    this.router.route('', 'home', function() {
      self.router.navigate('dashboard', {trigger: true});
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
    this.router.route('project/:projectId', 'project', this.projectShow);
  },

  // Should be rendered just once
  render: function () {
    var self = this;
    var loginUrl = 'https://github.com/login/oauth/authorize?client_id=' + config.oauth_client_id + '&scope=repo, user&redirect_uri=' + window.location.href;
    this.el.find('.user-status login a').attr('href', loginUrl);
    // we will override if logged in
    this.el.find('.user-status').addClass('logged-out');

    if ($.cookie("oauth-token")) {
      this.finishLogin();
    }

    // now append views
    this.dashboardView = new views.Dashboard({
      collection: this.projectList
    });
    this.dashboardView.render();
    $('#main').append(this.dashboardView.el);
    this.dashboardView.bind('load', this.onLoadProject);

    this.loadView = new views.Load({});
    this.loadView.render();
    $('#main').append(this.loadView.el);

    this.loadView.bind('load', this.onLoadProject);

    this.saveView = new views.Save({});
    this.saveView.render();
    $('#main').append(this.saveView.el);

    return this;
  },

  // Helpers
  // -------

  switchView: function(name, path) {
    $('body').removeClass().addClass('current-view '+name);
    $('#main .view').hide();
    $('#main .view.' + name).show();
    if (path) {
      this.router.navigate(path);
    } else {
      this.router.navigate(name);
    }
  },

  finishLogin: function(cb) {
    var self = this;
    models.loadUserInfo(function() {
      self.el.find('.user-status').removeClass('logged-out');
      self.el.find('.user-status .username').text(app.username);
      window.authenticated = true;
      if (cb) {
        cb();
      }
    });
  },

  onLoadProject: function(project) {
    this.projectList.add(project);
    this.projectShow(project.id);
  },

  // Main Views
  // ----------

  projectShow: function(projectId) {
    var self = this;
    var project = this.projectList.get(projectId);
    // housekeeping
    this.currentProject = project;
    this.saveView.project = project;

    //this.loading('Loading dataset ...');
    $('#main-menu a.grid-selector').tab('show');

    // if we not yet have data loaded, load it now ...
    if (!project.dataset) {
      project.loadSourceDataset(displayIt)
    } else {
      displayIt();
    }

    function displayIt(err) {
      if (err) {
        // this.notify('error', 'The requested resource could not be found.');
        return;
      }
      var ds = new views.Project({
        model: project
      });
      $('#main').append(ds.el);
      ds.render();
      self.switchView('project', 'project/'+ projectId);
    }
  },

  notify: function(type, message) {
    $('#main').append(new views.Notification(type, message).render().el);
  },

  loading: function(msg) {
    $('#main').html('<div class="loading"><span>'+ msg || 'Loading ...' +'</span></div>');
  },

  loaded: function() {
    $('#main .loading').remove();
  }

});

}).apply(this, window.args);
