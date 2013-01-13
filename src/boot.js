this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.app = {
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

window.args = _(this.DataExplorer.app).toArray();

(function(config, models, views, routers, utils, templates) {
  $(window).load(function() {

    // check for special case where this window is being used for doing the login
    var match = window.location.href.match(/\?code=([a-z0-9]*)/);
    if (match) {
      handleGithubLogin(match);
      return;
    }

    // ... we are not doing a login!
    // Check whether we are logged in and boot the app

    // Start the engines
    DataExplorer.app.instance = new DataExplorer.View.Application({ el: '.transformer-app', model: {} }).render();

    // listen for login success in login window
    window.addEventListener("message", function(evt) {
        $.cookie('oauth-token', evt.data);
        DataExplorer.app.instance.finishLogin();
      }
      , false
    );

    // Start responding to routes
    Backbone.history.start();
  });

  var handleGithubLogin = function(match) {
    var html = ' \
      <div class="view login"> \
        <div class="splash"> \
          <div class="authorize"> \
            <h1>Completing Login</h1> \
            <p>We are completing your login!</p> \
          </div> \
        </div> \
      </div> \
    ';
    $('.navbar').hide();
    $('#main').html(html);
    // complete the login process
    $.getJSON(DataExplorer.app.config.gatekeeper_url + '/authenticate/'+match[1], function(data) {
      window.opener.postMessage(data.token, window.location)
      window.close();
    });
  }

}).apply(this, window.args);
