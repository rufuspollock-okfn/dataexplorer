(function(config, models, views, routers, utils, templates) {

views.Projects = Backbone.View.extend({
  template: ' \
    <div class="view projects"> \
      <h2>Load one of your existing projects or <em><a href="#load">Create a new one &raquo;</a></em></h2> \
      {{#projects}} \
      <div class="project summary"> \
        <h3><a href="#{{id}}" class="js-load-project">{{source.url}}</a></h3> \
        Last updated: {{last_modified}} \
      </div> \
      {{/projects}} \
    </div> \
  ',

  render: function() {
    var tmp = Mustache.render(this.template, {
      projects: this.collection.toJSON()
    });
    this.$el.html(tmp);
  },

  events: {
    'click a.js-load-project': 'loadProject'
  },

  loadProject: function(e) {
    var self = this;
    e.preventDefault();
    var projectId = $(e.target).attr('href').slice(1);
    var project = this.collection.get(projectId);
    project.loadSourceDataset(function(err) {
      self.trigger('load', project);
    });
  }
});

}).apply(this, window.args);
