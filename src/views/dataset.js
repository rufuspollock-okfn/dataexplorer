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
       }
    ];
		this.grid = new recline.View.MultiView({
      model: this.model,
      views: views
    });
		this.editor = new recline.View.Transform({model: this.model });

    this.el.find('#grid').empty().append(this.grid.el);
    this.el.find('#editor').empty().append(this.editor.el);
    this.editor.render();

		this.model.query();

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
          <div class="tab-pane active" id="grid"></div> \
          <div class="tab-pane" id="transformations"> \
            <div id="editor"></div> \
          </div> \
        </div> \
      </div> \
    </div> \
  '
});

}).apply(this, window.args);
