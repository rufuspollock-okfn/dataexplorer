(function () {
module("Grid");

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

test('Add-Row', function () {
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
    ],
    views: [
      {
        id: 'grid',
        label: 'Grid',
        // must be in recline.View namespace for the present
        type: 'SlickGrid',
	  state: {
          gridOptions: {
            editable: true,
            enabledAddRow: true,
	      enabledDelRow: true,
            autoEdit: false,
            enableCellNavigation: true
          },
          columnsEditor: [
            { column: 'date', editor: Slick.Editors.Date },
            { column: 'Price', editor: Slick.Editors.Text }
          ]
        }
      }
    ]
  });
  project.datasets.at(0).fetch();
  var view = new DataExplorer.View.Project({
    model: project
  });
  $('.fixtures').append(view.el);
  // be sur that sidebar is here
  view.render();
  var gidView   = view.views[0].view
  assertPresent('.recline-row-add', gidView.elSidebar);
  old_length = project.datasets.at(0).records.length
  project.datasets.at(0).records.on('add',function(record){
     equal(project.datasets.at(0).records.length ,old_length + 1) 
  });

  gidView.elSidebar.find('.recline-row-add').click();
  view.remove();
});

//test delete row
test('Delete-Row', function () {
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
    ],
    views: [
      {
        id: 'grid',
        label: 'Grid',
        // must be in recline.View namespace for the present
        type: 'SlickGrid',
	  state: {
          gridOptions: {
            editable: true,
            enabledAddRow: true,
	      enabledDelRow: true,
            autoEdit: false,
            enableCellNavigation: true
          },
          columnsEditor: [
            { column: 'date', editor: Slick.Editors.Date },
            { column: 'Price', editor: Slick.Editors.Text }
          ]
        }
      }
    ]
  });
  project.datasets.at(0).fetch();
  var view = new DataExplorer.View.Project({
    model: project
  });
  $('.fixtures').append(view.el);
  // be sur that sidebar is here
  view.render();
  var gidView   = view.views[0].view
  old_length = project.datasets.at(0).records.length
  project.datasets.at(0).records.on('remove', function(record){
    equal(project.datasets.at(0).records.length, old_length -1);
  });
  // Be sure a cell change triggers a change of the model
  e = new Slick.EventData();
  gidView.grid.onClick.notify({
    row: 1,
    cell: 0,
    grid: view.grid
  }, e, gidView.grid);
  view.remove();
  });
})();

