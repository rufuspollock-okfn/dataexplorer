(function(config, models, views, routers, utils, templates) {

views.Projects = Backbone.View.extend({
  template: ' \
    <div class="view projects"> \
      <div class="page-header"> \
      <h2>Existing Projects ({{total}})</h2> \
  </div> \
      <p> \
        Not looking for an existing project? <a href="#load">Create a new project by loading some data here &raquo;</a>\
      </p> \
      <hr /> \
      {{#projects}} \
      <div class="project summary"> \
        <h3 class="title"><a href="#{{id}}" class="js-load-project">{{showTitle}}</a></h3> \
        Last modified: {{last_modified_nice}} \
        <br /> \
        Data source: {{source.url}} \
      </div> \
      {{/projects}} \
    </div> \
  ',

  initialize: function() {
    this.collection.bind('add', this.render);
    this.collection.bind('reset', this.render);
    this.collection.bind('remove', this.render);
  },

  render: function() {
    var projects = _.map(this.collection.toJSON(), function(project) {
      project.last_modified_nice = new Date(project.last_modified).toString();
      project.showTitle = project.title || project.source.url;
      console.log(project.showTitle);
      return project;
    });
    var tmp = Mustache.render(this.template, {
      total: projects.length,
      projects: projects
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
