(function(my) {
"use strict";

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
          <a href="{{url}}" class="js-load-project">{{showTitle}}</a> \
          <a class="btn btn-danger js-trash-project" data-project-id="{{id}}">Move to Trash</a> \
        </h3> \
        Last modified: {{last_modified_nice}} \
        {{#datasource}} \
        <br /> \
        Data source: {{datasource}} \
        {{/datasource}} \
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
    var projects = this.collection.map(function(project) {
      var context = project.toJSON();
      context.last_modified_nice = project.last_modified.toString();
      context.showTitle = context.name || 'No name';

      if (context.sources) {
        context.datasource = _.pluck(context.sources, "web").join(", ");
      }

      if (project.gist_id) {
        context.url = "#" + DataExplorer.app.instance.username + "/" + project.gist_id;
      } else {
        context.url = "#project/" + context.id;
      }

      return context;
    });
    projects = _.filter(projects, function(project) {
      return project.state !== 'trash';
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
