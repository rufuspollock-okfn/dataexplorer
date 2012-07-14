(function(config, models, views, routers, utils, templates) {

views.Dataset = Backbone.View.extend({
  id: 'start',

  events: {
    'click .save-dataset': '_saveDataset'
  },

  _saveDataset: function() {
  	var data = "RAW_CSV_TO_WRITE_BACK to GitHub";
  	// TODO: find a way to serialize data as CSV again
  	saveDataset(this.user, this.repo, this.branch, data, "updated file", function() {
  		alert('saved. yay!');
  	});
  	return false;
  },

  initialize: function(options) {
  	this.user   = options.user;
  	this.repo   = options.repo;
  	this.branch = options.branch;

		// this.view = new recline.View.Grid({model: this.model, id: 'dataset'});
		this.editor = new recline.View.Transform({model: this.model, id: 'editor'});
		this.model.query();
  },

  render: function() {
    $(this.el).html(templates.dataset(this.model));
    this.$('#records').empty().append(this.editor.el);
    return this;
  }
});

}).apply(this, window.args);