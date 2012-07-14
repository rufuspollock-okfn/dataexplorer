(function(config, models, views, routers, utils, templates) {

views.Dataset = Backbone.View.extend({
  id: 'start',

  events: {
    'click .save-dataset': '_saveDataset'
  },

  _saveDataset: function() {
  	// TODO:
  },

  initialize: function(options) {},

  render: function() {
  	console.log(this.model);
    $(this.el).html(templates.dataset(this.model));
    return this;
  }
});

}).apply(this, window.args);