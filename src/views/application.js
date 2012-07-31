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
    this.el = $(this.el);
    _.bindAll(this);
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
    
    return this;
  },


  // Helpers
  // -------

  replaceMainView: function (name, view) {
    $('body').removeClass().addClass('current-view '+name);
    // Make sure the header gets shown
    if (name !== "start") $('#header').show();

    if (this.mainView) {
      this.mainView.remove();
    } else {
      $('#main').empty();
    }
    this.mainView = view;
    $(view.el).appendTo(this.$('#main'));
  },


  // Main Views
  // ----------

  static: function() {
    this.header.render();
    // No-op ;-)
  },

  dataset: function(user, repo, branch) {
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
	  var ds_r = ds.render();
	  this.mainView = ds_r;
    }, this));
  },

  start: function(username) {
    var that = this;
    this.replaceMainView("start", new views.Start({
      id: "start",
      model: _.extend(this.model, { authenticated: !!window.authenticated} )
    }).render());
  },

  notify: function(type, message) {
    this.header.render();
    this.replaceMainView("notification", new views.Notification(type, message).render());
  },

  loading: function(msg) {
    $('#main').html('<div class="loading"><span>'+ msg || 'Loading ...' +'</span></div>');
  },

  loaded: function() {
    $('#main .loading').remove();
  }

});

}).apply(this, window.args);
