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
      <h1 style="text-align: center; margin: 30px;">How It Works</h1> \
      <div class="row instructions"> \
        <div class="span3"> \
          <div class="well"> \
            <h3>1. Login</h3> \
            <p>Login to GitHub so that we can save your work later</p> \
          </div> \
        </div> \
        <div class="span3"> \
          <div class="well"> \
            <h3>2. Load Some Data</h3> \
            <p>Load data from online sources (e.g. the DataHub, GitHub or CSVs online)</p> \
          </div> \
        </div> \
        <div class="span3"> \
          <div class="well"> \
            <h3>3. Clean It Up</h2> \
            <p>Write simple javascript or use the built-in functions to clean up the data.</p> \
          </div> \
        </div> \
        <div class="span3"> \
          <div class="well"> \
            <h3>4. Save the Result</h3> \
            <p>Save the resulting <strong>data and scripts</strong> to GitHub</p> \
          </div> \
        </div> \
      </div> \
   \
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
