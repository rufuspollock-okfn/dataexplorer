(function () {
module("Util");

asyncTest('loadData github', function () {
  DataExplorer.Util.loadData('https://github.com/datasets/population/blob/master/data/population.csv', function(err, data) {
    var firstLine = data.split('\r\n')[0];
    equal(firstLine, 'Country Name,Country Code,Year,Value');
    start();
  });

});

asyncTest('loadData csv', function () {
  var url = 'https://raw.github.com/okfn/dataconverters/master/testdata/csv/simple.csv';
  DataExplorer.Util.loadData(url, function(err, data) {
    equal(data.fields[0], 'date');
    start();
  });
});

asyncTest('loadData tsv', function () {
  var url = 'https://raw.github.com/okfn/dataconverters/master/testdata/tsv/simple.tsv';
  DataExplorer.Util.loadData(url, function(err, data) {
    equal(data.fields[0], 'date');
    start();
  });
});

asyncTest('loadData xls', function () {
  var url = 'https://raw.github.com/okfn/dataconverters/master/testdata/xls/simple.xls'
  DataExplorer.Util.loadData(url, function(err, data) {
    equal(data.fields[0], 'date');
    start();
  });
});


})();
