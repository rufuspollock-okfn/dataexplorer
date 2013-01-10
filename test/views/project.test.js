(function () {
module("Views - Project");

test('Project', function () {
  var project = new DataExplorer.Model.Project({
    id: 'data',
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
  view.remove();
});

})();

