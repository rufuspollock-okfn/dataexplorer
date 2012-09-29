(function(config, models, views, routers, utils, templates) {

// This is the top-level piece of UI.

views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .toggle-view': 'toggleView',
    'click a.logout': '_logout'
  },

  _logout: function() {
    logout();
    app.instance.render();
    if ($('#start').length > 0) {
      app.instance.start();
    } else {
      window.location.reload();
    }
    
    return false;
  },

  toggleView: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var link  = $(e.currentTarget),
        route = link.attr('href').replace(/^\//, '');
    
    $('.toggle-view.active').removeClass('active');
    link.addClass('active');
    router.navigate(route, true);
  },

  // Initialize
  // ----------

  initialize: function () {
    var self = this;
    this.el = $(this.el);
    _.bindAll(this);
    this.router = new Backbone.Router();
    this.router.route('', 'home', function() {
      if (!window.authenticated) {
        self.router.navigate('login', {trigger: true});
      } else {
        self.router.navigate('load', {trigger: true});
      }
    });
    this.router.route('login', 'login', function() {
      self.switchView('login');
    });
    this.router.route('load', 'load', function() {
      self.switchView('load');
    });
    this.router.route('save', 'save', function() {
      self.switchView('save');
    });
    this.router.route('start', 'start', function() {
      self.switchView('start');
    });
  },

  // Should be rendered just once
  render: function () {
    var loginUrl = 'https://github.com/login/oauth/authorize?client_id=' + config.oauth_client_id + '&scope=repo, user&redirect_uri=' + window.location.href;
    this.el.find('.user-status login a').attr('href', loginUrl);
    if (!window.authenticated) {
      this.el.find('.user-status').addClass('logged-out');
    } else {
      this.el.find('.user-status').removeClass('logged-out');
    }
    this.el.find('.user-status .username').text(app.username);

    // now append views
    this.loginView = new views.Login({
    });
    this.loginView.render();
    $('#main').append(this.loginView.el);

    this.loadView = new views.Load({});
    this.loadView.render();
    $('#main').append(this.loadView.el);

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

  // Main Views
  // ----------

  static: function() {
    this.header.render();
    // No-op ;-)
  },

  dataset: function(user, repo, branch) {
    var self = this;
    //this.loading('Loading dataset ...');
    $('#main-menu a.grid-selector').tab('show');

    loadDataset(user, repo, branch, _.bind(function (err, dataset) {
      this.loaded();
      if (err) return this.notify('error', 'The requested resource could not be found.');

      var ds = new views.Dataset({
        model: dataset, 
        id: 'dataset', 
        user: user, 
        repo: repo, 
        branch: branch 
      });
      ds.render();
      $('#main').append(ds.el);

      var saveView = new views.Save({
        model: dataset
      });
      saveView.render();
      $('#main').append(saveView.el);

      self.switchView('start');
    }, this));
  },

  start: function() {
    this.switchView('start');
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
