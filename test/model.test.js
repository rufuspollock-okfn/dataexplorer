(function () {
module("Model");

test('Project: basics', function () {
  var project = new DataExplorer.Model.Project({name: 'abc'});
  equal(project.get('name'), 'abc');
  equal(project.scripts.length, 1);
  equal(project.get('manifest_version'), 1);
});

})();
