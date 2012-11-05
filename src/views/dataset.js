(function(config, models, views, routers, utils, templates) {

views.Dataset = Backbone.View.extend({
  id: 'start',

  events: {
  },

  initialize: function(options) {
    this.el = $(this.el);
  },

  render: function() {
    this.el.html(this.template);
    var views = [
       {
         id: 'grid',
         label: 'Grid', 
         view: new recline.View.SlickGrid({
           model: this.model
         })
       },
       {
         id: 'map',
         label: 'Map',
         view: new recline.View.Map({
           model: this.model
         })
       },
       {
         id: 'graph',
         label: 'Graph',
         view: new recline.View.Graph({
           model: this.model
         })
       }
    ];

    // see below!
    var width = this.el.find('.multiview-here').width();

		this.grid = new recline.View.MultiView({
      el: this.el.find('.multiview-here'),
      model: this.model,
      views: views
    });
		this.editor = new recline.View.Transform({model: this.model });

    this.el.find('#editor').append(this.editor.el);
    this.editor.render();

		this.model.query();

    // HACK - for some reason the grid view of multiview is massively wide by default
    this.el.find('.view.start .recline-data-explorer').width(width);

    return this;
  },

  template: ' \
    <div class="view start"> \
      <div class="tabbable"> \
        <ul class="nav nav-tabs"> \
          <li class="active"> \
            <a href="#grid" data-toggle="tab" class="grid-selector">Grid</a> \
            </li> \
          <li> \
            <a href="#transformations" data-toggle="tab">Transformations</a> \
          </li> \
        </ul> \
        <div class="tab-content"> \
          <div class="tab-pane active" id="grid"> \
            <div class="multiview-here"></div> \
          </div> \
          <div class="tab-pane" id="transformations"> \
            <div id="editor"></div> \
          </div> \
        </div> \
      </div> \
    </div> \
  '
});

}).apply(this, window.args);
