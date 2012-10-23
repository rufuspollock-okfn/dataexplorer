(function(config, models, views, routers, utils, templates) {

views.Dataset = Backbone.View.extend({
  id: 'start',

  events: {
    'click .toggle-transform': '_toggleTransform'
  },

  _toggleTransform: function(e) {
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

		this.grid = new recline.View.Grid({model: this.model, id: 'dataset'});
		this.editor = new recline.View.Transform({model: this.model });
    this.editor.render();
		this.model.query();
  },

  render: function() {
    var rendered = _.template(this.template, {
    	name: this.model.title 
    });
    this.el.html(rendered);
    this.el.find('#grid').empty().append(this.grid.el);
    this.el.find('#editor').empty().append(this.editor.el);
    this.el.find('.nav-tabs a:last').tab('show');
    this.el.find('#transformations').show();
    return this;
  },

  template: ' \
    <div class="view start"> \
      <ul id="main-menu" class="nav nav-tabs"> \
        <li><a class="grid-selector" href="#grid" data-toggle="tab">Grid</a></li> \
        <li><a href="#transformations" data-toggle="tab">Transformations</a></li> \
      </ul> \
 \
      <div class="tab-content"> \
        <div class="tab-pane" id="grid"></div> \
        <div class="tab-pane" id="transformations"> \
          <div id="editor"></div> \
        </div> \
      </div> \
    </div> \
  '
});

}).apply(this, window.args);
