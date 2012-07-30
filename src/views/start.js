(function(config, models, views, routers, utils, templates) {

views.Start = Backbone.View.extend({
  id: 'start',

  events: {
    'submit #login_form': '_login',
    'click .load-dataset': '_loadDataset',
    'click .save-dataset': '_saveDataset',
  },

  initialize: function(options) {},

  _saveDataset: function() {
	return false;
  },

  _loadDataset: function() {
    var url = $("div.control-group input[name=source]").first().val();
    var user = url.split("/")[3];
    var repo = url.split("/")[4];
    var branch = url.split("/")[6];
    app.instance.dataset(user, repo, branch);
//  app.instance.dataset("datasets", "transformer-test", "master");
    return false;
  },

  _login: function() {
    var self = this;

    var user = self.$('#github_user').val();
    var password = self.$('#github_password').val();

    login({username: user, password: password}, function(err) {
      if (err) return self.$('.bad-credentials').show();
      window.location.reload();
    });
    return false;
  },

  render: function() {
    this.model.oauth_client_id = window.app.config.oauth_client_id;
    $(this.el).html(templates.start(this.model));
    return this;
  }
});

}).apply(this, window.args);
