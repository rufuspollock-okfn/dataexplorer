(function () {
module("Views - Load");

test('Load', function () {
  // We're not signed-in, so this can't test much.
  var view = new DataExplorer.View.Load({});
  $('.fixtures').append(view.render().el);
  $("#paste textarea").val("1,2");
  $('#paste .load-dataset').click();

  var ds = view.previewPane.getModel();
  deepEqual(ds.toJSON(), {
    backend: 'csv',
    data: '1,2'
  });
  view.remove();
});

})();

