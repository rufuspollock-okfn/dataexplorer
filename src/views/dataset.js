(function(config, models, views, routers, utils, templates) {

views.Dataset = Backbone.View.extend({
  id: 'start',

  events: {
    'click .save-dataset': '_saveDataset',
    'click .toggle-transform': '_toggleTransform'
  },

  _toggleTransform: function() {
  	if ($('#grid').hasClass('active')) {
  		$('#grid').removeClass();
  		$('#editor').addClass('active');
  	} else {
  		$('#editor').removeClass();
  		$('#grid').addClass('active');
  	}
  	return false;
  },

  _saveDataset: function() {

  	function serializeCSV(dataset) {
  		var records = [];
  		records.push(dataset.fields.pluck('id'));
  		_.each(dataset._store.data, function(record, index) {
  			// TODO: WTF?!
  			if (index > 20) return;
  			// TODO: WTF?! END
  			var tmp = [];
  			dataset.fields.each(function(field) {
  				tmp.push(record[field.id]);
  			});
  			records.push(tmp);
  		});
  		return recline.Backend.CSV.serializeCSV(records);
  	}

  	var rawCSV = serializeCSV(this.model);

  	// TODO: find a way to serialize data as CSV again
  	saveDataset(this.user, this.repo, this.branch, rawCSV, "updated file", function() {
  		alert('saved. yay!');
  	});
  	return false;
  },

  initialize: function(options) {
  	this.user   = options.user;
  	this.repo   = options.repo;
  	this.branch = options.branch;

		this.grid = new recline.View.Grid({model: this.model, id: 'dataset'});
		this.editor = new recline.View.Transform({model: this.model });
		this.model.query();
  },

  render: function() {
    $(this.el).html(templates.dataset({
    	name: this.user + " / " + this.repo
    }));
    this.$('#grid').empty().append(this.grid.el);
    this.$('#editor').empty().append(this.editor.el);
    return this;
  }
});

}).apply(this, window.args);