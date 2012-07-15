---
---
// Gimme a Github object! Please.
function github() {
  return new Github({
    token: $.cookie('oauth-token'),
    username: $.cookie('username'),
    auth: "oauth"
  });
}

var currentRepo = {
  user: null,
  repo: null,
  instance: null
};

// Smart caching (needed for managing subsequent updates)
// -------

function getRepo(user, repo) {
  if (currentRepo.user === user && currentRepo.repo === repo) {
    return currentRepo.instance; // Cached
  }

  currentRepo = {
    user: user,
    repo: repo,
    instance: github().getRepo(user, repo)
  };

  return currentRepo.instance;
}


// Load Application
// -------
// 
// Load everything that's needed for the app + header

function loadApplication(cb) {
  if (window.authenticated) {
    $.ajax({
      type: "GET",
      url: 'https://api.github.com/user',
      dataType: 'json',
      contentType: 'application/x-www-form-urlencoded',
      headers : { Authorization : 'token ' + $.cookie('oauth-token') },
      success: function(res) {
        $.cookie("avatar", res.avatar_url);
        $.cookie("username", res.login);
        app.username = res.login;

        var user = github().getUser();
        var owners = {};

        cb(null);

      },
      error: function(err) { 
        cb('error');
      }
    });

  } else {
    cb(null);
  }
}

// Authentication
// -------

function authenticate() {
  if ($.cookie("oauth-token")) return window.authenticated = true;

  var match = window.location.href.match(/\?code=([a-z0-9]*)/);

  // Handle Code
  if (match) {
    $.getJSON('{{site.gatekeeper_url}}/authenticate/'+match[1], function(data) {
      $.cookie('oauth-token', data.token);
      window.authenticated = true;
      // Adjust URL
      var regex = new RegExp("\\?code="+match[1]);

      window.location.href = window.location.href.replace(regex, '').replace('&state=', '');
    });
    return false;
  } else {
    return true;  
  }
}

function logout() {
  window.authenticated = false;
  $.cookie("oauth-token", null);
}

// Load Dataset
// -------

function loadDataset(user, repo, branch, cb) {
  var repo = getRepo(user, repo);

  repo.read(branch, 'data/data.csv', function(err, raw_csv) {
    var dataset = new recline.Model.Dataset({data: raw_csv, backend: 'csv'});
    dataset.fetch();
    cb(err, dataset);
  });
}

// Save Dataset
// -------

function saveDataset(user, repo, branch, data, commitMessage, cb) {
  var repo = getRepo(user, repo);

  repo.write(branch, 'data/data.csv', data, commitMessage, function(err) {
    cb(err);
  });
}