window.app = {
    config: {
      gatekeeper_url: 'http://transformer-datahub-gatekeeper.herokuapp.com/',
      oauth_client_id: 'de55312927208bfe772e'
    },
    models: {},
    views: {},
    routers: {},
    utils: {},
    templates: _($('script[name]')).reduce(function(memo, el) {
      memo[el.getAttribute('name')] = _(el.innerHTML).template();
      return memo;
    }, {}),
    state: {'repo': ''},
    instance: null
};

window.args = _(window.app).toArray();

(function(config, models, views, routers, utils, templates) {
  $(function() {

    if (models.authenticate()) {
      models.loadApplication(function(err, data) {
        // Start the engines
        window.app.instance = new views.Application({ el: '.transformer-app', model: {} }).render();

        // Start responding to routes
        Backbone.history.start();
      });
    }
  });
}).apply(this, window.args);
