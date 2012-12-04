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
    var url = 'https://github.com/login/oauth/authorize?client_id=' + config.oauth_client_id + '&scope=repo, user';
    window.open(url, 'Data Explorer - Github Login', 'height=400,width=400');
  },

  // Initialize
  // ----------

  initialize: function () {
    var self = this;
    this.el = $(this.el);
    _.bindAll(this);
    this.router = new Backbone.Router();

    // TODO: make this somewhat nicer - e.g. show a loading message etc
    var state = recline.View.parseQueryString(decodeURIComponent(window.location.search));
    if (state.backend) {
      var project = new models.Project();
      project.loadSourceDataset(state, function(err) {
        if (err) {
          // this.notify('error', 'The requested resource could not be found.');
        }
        self.dataset(project);
      });
    }
    
    this.router.route('', 'home', function() {
      self.router.navigate('load', {trigger: true});
    });
    this.router.route('load', 'load', function() {
      self.switchView('load');
    });
    this.router.route('save', 'save', function() {
      self.switchView('save');
    });
    this.router.route('dataset', 'dataset', function() {
      self.switchView('dataset');
    });
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
    this.loadView = new views.Load({});
    this.loadView.render();
    $('#main').append(this.loadView.el);

    this.loadView.bind('load', function(project) {
      self.dataset(project);
	  self.saveView.project = project;
    });

    this.saveView = new views.Save({});
    this.saveView.render();
    $('#main').append(this.saveView.el);

    return this;
  },

  // Helpers
  // -------

  switchView: function(name) {
    $('body').removeClass().addClass('current-view '+name);
    $('#main .view').hide();
    $('#main .view.' + name).show();
    this.router.navigate(name);
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

  // Main Views
  // ----------

  dataset: function(project) {
    var self = this;
    self.switchView('dataset');

    //this.loading('Loading dataset ...');
    $('#main-menu a.grid-selector').tab('show');

    var ds = new views.Dataset({
      model: project.dataset, 
      id: 'dataset'
    });
    $('#main').append(ds.el);
    ds.render();
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
