(function(config, models, views, routers, utils, templates) {

views.Login = Backbone.View.extend({
  id: 'login',

  initialize: function(options) {
    this.el = $(this.el);
  },

  render: function() {
    var rendered = _.template(this.template, {
      oauth_client_id: config.oauth_client_id
    });
    this.el.html(rendered);
    return this;
  },
  
  template: ' \
    <div class="view login"> \
      <div class="splash"> \
        <div class="authorize"> \
          <h1>Get Started</h1> \
          <p>Login to GitHub to get started!</p> \
          <a class="button" href="https://github.com/login/oauth/authorize?client_id=<%= oauth_client_id %>&scope=repo, user">Authorize with GitHub</a> \
        </div> \
      </div> \
    </div> \
  '
});

}).apply(this, window.args);
