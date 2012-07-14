(function(config, models, views, routers, utils, templates) {

views.Dataset = Backbone.View.extend({
  id: 'start',

  events: {
    'click .select-repo': '_selectRepo'
  },

  initialize: function(options) {},


  render: function() {
    $(this.el).html(templates.profile(this.model));
    return this;
  }
});

}).apply(this, window.args);