(function(config, models, views, routers, utils, templates) {

views.Dataset = Backbone.View.extend({
  id: 'start',

  events: {
    'click .toggle-transform': '_toggleTransform'
  },

  _toggleTransform: function(e) {
    e.preventDefault();
    var viewName = $(e.target).attr('data-view');
    this.el.find('.dataset-menu .views a').removeClass('active');
    this.el.find('.dataset-menu .views a[data-view="' + viewName + '"]').addClass('active');
    if (viewName == 'grid') {
  		$('#editor').hide();
  		$('#grid').show();
    } else {
  		$('#grid').hide();
  		$('#editor').show();
    }
  	return false;
  },

  initialize: function(options) {
    this.el = $(this.el);
  	this.user   = options.user;
  	this.repo   = options.repo;
  	this.branch = options.branch;

		this.grid = new recline.View.Grid({model: this.model, id: 'dataset'});
		this.editor = new recline.View.Transform({model: this.model });
    this.editor.render();
		this.model.query();
  },

  render: function() {
    $(this.el).html(templates.dataset({
    	name: this.user + " / " + this.repo
    }));
    $('#grid').empty().append(this.grid.el);
    $('#editor').empty().append(this.editor.el);
    return this;
  }
});

}).apply(this, window.args);
