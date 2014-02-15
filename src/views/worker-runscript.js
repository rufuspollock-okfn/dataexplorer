// Convert all arguments to Strings (Objects will be JSONified).
importScripts('../../vendor/recline/vendor/underscore/1.4.4/underscore.js');
importScripts('../../vendor/recline/vendor/underscore.deferred/0.4.0/underscore.deferred.js');
importScripts('../../vendor/browser-request/request.js');
importScripts('../../vendor/github.js');
importScripts('../util.js');
importScripts('../../vendor/backbone.js');
importScripts('../../vendor/recline/dist/recline.dataset.js');
importScripts('../../vendor/csv.js/csv.js');

// Convert all arguments to Strings (Objects will be JSONified).
var print = function() {
  var items = [];
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    try {
      items.push(typeof(value) == 'object' ? JSON.stringify(value) : String(value));
    } catch(e) {}
  }
  var msg = items.join(" ");
  self.postMessage({msg: 'print', data: msg});
};

console = {};
console.log = print;
console.error = print;

var saveDataset = function(dataset) {
  self.postMessage({msg: 'saveDataset', fields: dataset.fields, records: dataset.records });
};

self.onmessage = runScript;

function runScript(ev) {
  var inputId = ev.data.id,
    src = ev.data.src;

  function loadDataset(name, callback) {
    var ds = ev.data.datasets[name];
    callback(null, new recline.Backend.Memory.Store(ds.records, ds.fields));
  };

  try {
    self.postMessage({inputId: inputId, msg: 'eval::start'});

    var result = eval(src);
    if (!result) {
      result = '-';
    }

    // we do not generally want to print the result of a function
    if (_.isFunction(result)) {
      result = '-';
    }

    self.postMessage({inputId: inputId, msg: 'result', data: result.toString()});
  }
  catch (error) {
    self.postMessage({inputId: inputId, msg: 'error', data: error.toString()});
    // console.log(error);
  } finally {
    self.postMessage({inputId: inputId, msg: 'eval::end'});
  }
}

