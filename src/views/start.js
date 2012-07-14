(function(config, models, views, routers, utils, templates) {

views.Start = Backbone.View.extend({
  id: 'start',

  events: {
    'submit #login_form': '_login',
    'submit #load_dataset_form': '_loadDataset',
  },

  initialize: function(options) {},

  _loadDataset: function() {
    app.instance.dataset("datasets", "standard-and-poors-500-shiller", "master");
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
    $(this.el).html(templates.start(this.model));
    return this;
  }
});

}).apply(this, window.args);