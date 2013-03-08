(function(my) {

my.Dashboard = Backbone.View.extend({
  className: 'view dashboard',
  template: ' \
    <div> \
      <div class="page-header"> \
        <h2> \
          Existing Data Projects ({{total}}) \
          <a href="#load" class="btn btn-large load-btn">Create a new project</a> \
        </h2> \
      </div> \
      {{#projects}} \
      <div class="project summary"> \
        <h3 class="title"> \
          <a href="#project/{{id}}" class="js-load-project">{{showTitle}}</a> \
          <a class="btn btn-danger js-trash-project" data-project-id="{{id}}">Move to Trash</a> \
        </h3> \
        Last modified: {{last_modified_nice}} \
        <br /> \
        Data source: {{datasource}} \
      </div> \
      {{/projects}} \
    </div> \
  ',

  events: {
    'click .js-trash-project': 'onTrashProject'
  },

  initialize: function() {
    _.bindAll(this, 'render');
    this.collection.bind('add', this.render);
    this.collection.bind('reset', this.render);
    this.collection.bind('remove', this.render);
    this.collection.bind('change', this.render);
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
    projects = _.filter(projects, function(project) {
      return project.state != 'trash'
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
  },

  onTrashProject: function(e) {
    e.preventDefault(); 
    var id = $(e.target).attr('data-project-id');
    this.collection.get(id).set({state: 'trash'});
  }
});

}(this.DataExplorer.View));
