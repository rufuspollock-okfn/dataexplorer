(function () {
module("Model");

test('Project: basics', function () {
  var project = new DataExplorer.Model.Project({name: 'abc'});
  equal(project.get('name'), 'abc');
  equal(project.scripts.length, 1);
  equal(project.get('manifest_version'), 1);
  equal(project.datasets.length, 0);
});

test('Project: datasets', function () {
  var project = new DataExplorer.Model.Project({datasets: [ { id: 'xyz', format: 'json' } ]});
  equal(project.datasets.length, 1);
  equal(project.datasets.get('xyz').get('format'), 'json');
});

})();
