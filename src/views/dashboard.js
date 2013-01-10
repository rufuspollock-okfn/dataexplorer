(function(my) {

my.Dashboard = Backbone.View.extend({
  template: ' \
    <div class="view dashboard"> \
      <div class="page-header"> \
      <h2>Existing Projects ({{total}})</h2> \
  </div> \
      <p> \
        Not looking for an existing project? <a href="#load">Create a new project by loading some data here &raquo;</a>\
      </p> \
      <hr /> \
      {{#projects}} \
      <div class="project summary"> \
        <h3 class="title"><a href="#project/{{id}}" class="js-load-project">{{showTitle}}</a></h3> \
        Last modified: {{last_modified_nice}} \
        <br /> \
        Data source: {{datasets.0.url}} \
      </div> \
      {{/projects}} \
    </div> \
  ',

  initialize: function() {
    _.bindAll(this, 'render');
    this.collection.bind('add', this.render);
    this.collection.bind('reset', this.render);
    this.collection.bind('remove', this.render);
  },

  render: function() {
    var projects = _.map(this.collection.toJSON(), function(project) {
      project.last_modified_nice = new Date(project.last_modified).toString();
      project.showTitle = project.title || 'No title';
      return project;
    });
    var tmp = Mustache.render(this.template, {
      total: projects.length,
      projects: projects
    });
    this.$el.html(tmp);
  }
});

}(this.DataExplorer.View));
