(function(config, models, views, routers, utils, templates) {

// This is the top-level piece of UI.

views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .toggle-view': 'toggleView'
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
    _.bindAll(this);
    this.header = new views.Header({model: this.model});

    $(window).on('scroll', function() {
      if ($(window).scrollTop()>60) {
        $('#post').addClass('sticky-menu');
      } else {
        $('#post').removeClass('sticky-menu');
      }
    });
  },

  // Should be rendered just once
  render: function () {
    $(this.header.render().el).prependTo(this.el);
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
    this.loading('Loading dataset ...');
    loadDataset(user, repo, branch, _.bind(function (err, dataset) {
      this.loaded();
      if (err) return this.notify('error', 'The requested resource could not be found.');
      this.header.render();

      this.replaceMainView("dataset", new views.Dataset({model: dataset, id: 'dataset', user: user, repo: repo, branch: branch }).render());
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
