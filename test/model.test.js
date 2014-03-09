(function () {
module("Model");

test('Project: basics', function () {
  var project = new DataExplorer.Model.Project({name: 'abc'});
  equal(project.get('name'), 'abc');
  equal(project.scripts.length, 1);
  equal(project.datasets.length, 0);
  equal(project.get('views').length, 3);
  equal(project.get('views')[0].state.gridOptions.editable, true);
  equal(project.get('profiles').dataexplorer, "0.9");
});

test('Project: datasets', function () {
  var project = new DataExplorer.Model.Project({datasets: [ { id: 'xyz', format: 'json' } ]});
  equal(project.datasets.length, 1);
  equal(project.datasets.get('xyz').get('format'), 'json');
});

test('Project: loadSourceDataset', function () {
  var project = new DataExplorer.Model.Project({
    datasets: [ 
      {
        id: 'xyz',
        backend: 'csv',
        data: 'Date,Yield\n2012,1.8'
      }
    ]
  });
  project.loadSourceDataset(function(err, project) {
    equal(project.datasets.at(0).get('backend'), 'csv')  
    equal(project.datasets.at(0)._store.records.length, 1);
    equal(project.datasets.at(0).fields.length, 2);
    var field = {
      id: 'Date',
      type: 'string',
      label: 'Date',
      is_derived: false,
      format: null
    };
    deepEqual(project.datasets.at(0).fields.at(0).toJSON(), field);
    // check we get fields (does not work atm!)
    deepEqual(project.toJSON().datasets[0].fields[0], field);
  });
});

test('serializeProject', function () {
  var csvData = '"Date ""$""",Yield\n2012,1.8\n';
  var readme = 'This is the README';
  var project = new DataExplorer.Model.Project({
    name: 'test it',
    readme: readme,
    datasets: [ 
      {
        id: 'xyz',
        backend: 'csv',
        data: csvData,
        path: 'data.csv'
      }
    ],
    scripts: [
      {
        id: 'main.js',
        content: 'xyz'
      }
    ]
  });
  project.loadSourceDataset(function() {});

  // check some basics
  equal(project.toJSON().readme, readme, 'Check we have not changed the original project');
  equal(project.toJSON().scripts[0].content, 'xyz', 'Check we have not changed the original project');


  var dataFile = 'data.csv';

  // ==============
  // test serialize

  var out = DataExplorer.Model.serializeProject(project);

  equal(out.description, project.get('name') + ' - ' + readme);

  // check the data packaage
  var dp = JSON.parse(out.files['datapackage.json'].content);
  deepEqual(_.keys(out.files),
      ['datapackage.json', 'README.md', 'main.js']
    );
  ok(!_.hasOwnProperty(dp.scripts[0], 'content'), 'content key should be removed');
  equal(dp.datasets, undefined, 'on datapackage.json datasets is named resources');
  equal(dp.files, undefined, 'on datapackage.json datasets is named resources');
  equal(dp.resources[0].backend, 'csv');
  equal(dp.resources[0].data, undefined, 'We removed data attribute from the dataset');
  equal(dp.resources[0].schema.fields[0].id, 'Date "$"');

  // check the content
  deepEqual(out.files['main.js'].content, 'xyz');
  equal(out.files['README.md'].content, readme, 'README content correct');
  // no longer including data in basic serialization
  ok(!('data.csv' in out.files));

  // now set changes
  project.unsavedChanges.set({datasets: true});
  var outWithData = DataExplorer.Model.serializeProject(project); 
  deepEqual(outWithData.files['data.csv'].content, csvData);

  // ------------------------------------
  // Test unserialize now ...

  // make some changes prior to unserializing
  var newScriptContent = 'request("...")';
  var newReadme = 'New readme';
  out.files['main.js'].content = newScriptContent;
  out.files['README.md'].content = newReadme;

  // now unserialize ...
  var newProject = DataExplorer.Model.unserializeProject(out);
  equal(newProject.get('name'), project.get('name'));
  equal(newProject.scripts.at(0).get('content'), newScriptContent);
  // no longer including data in basic serialization
  // equal(newProject.datasets.at(0).get('data'), csvData);
  equal(newProject.get('readme'), newReadme, 'readme attribute correct');
  equal(newProject.get('datasets')[0].fields[0].id, 'Date "$"');
  equal(newProject.get('views')[0].state.gridOptions.editable, true);
});

})();
