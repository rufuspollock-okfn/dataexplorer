(function () {
module("Views - Load");

test('Load', function () {
  var view = new DataExplorer.View.Load({});
  $('.fixtures').append(view.el);
  view.render();
  $('#csv-online .load-dataset').click();
  ok(view.project);
  deepEqual(view.project.datasets.at(0).toJSON(), {
    backend: 'csv',
    url: ''
  });
  view.remove();
});

})();

