(function(my) {

my.Dashboard = Backbone.View.extend({
  template: ' \
    <div class="view dashboard"> \
      <div class="page-header"> \
        <h2> \
          Existing Data Projects ({{total}}) \
          <a href="#load" class="btn btn-large load-btn">Create a new project &raquo;</a> \
        </h2> \
      </div> \
      {{#projects}} \
      <div class="project summary"> \
        <h3 class="title"><a href="#project/{{id}}" class="js-load-project">{{showTitle}}</a></h3> \
        Last modified: {{last_modified_nice}} \
        <br /> \
        Data source: {{datasource}} \
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
      project.showTitle = project.name || 'No name';
      if (project.datasets.length > 0 && project.datasets[0]) {
        project.datasource = project.datasets[0].file ? project.datasets[0].filename : project.datasets[0].url;
      } else {
        project.datasource = '';
      }
      return project;
    });
    // sort by last modified (most recent first)
    projects.sort(function(a, b) {
      return a.last_modified < b.last_modified ?  1 : -1;
    });
    var tmp = Mustache.render(this.template, {
      total: projects.length,
      projects: projects
    });
    this.$el.html(tmp);
  }
});

}(this.DataExplorer.View));
