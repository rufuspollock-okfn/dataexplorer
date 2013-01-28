(function () {
module("Views - Project");

// stub some stuff
Backbone.history = {
  fragment: ''
};
DataExplorer.app = {
  instance: {
    router: {
      navigate: function() {}
    }
  }
}

test('Project', function () {
  var project = new DataExplorer.Model.Project({
    id: 'data',
    name: 'xyz',
    readme: 'readme\n\n# h1',
    datasets: [
      {
        id: 'data',
        records: [
          ['Date', 'Price'],
          ['2012', 1],
          ['2011', 2]
        ]
      }
    ]
  });
  project.datasets.at(0).fetch();
  var view = new DataExplorer.View.Project({
    model: project
  });
  $('.fixtures').append(view.el);
  view.render();
  equal($('.script-editor').length, 1);

  equal($('.readme').html(), '<p>readme</p>\n\n<h1 id="h1">h1</h1>', 'readme rendered ok');

  view.remove();
});

})();

