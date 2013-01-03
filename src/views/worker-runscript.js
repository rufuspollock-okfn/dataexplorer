importScripts('../../vendor/underscore.js');

self.onmessage = runScript;

function runScript(ev) {
  var inputId = ev.data.id,
    src = ev.data.src;

  var print = function(d) {
    self.postMessage({inputId: inputId, msg: 'print', data: d.toString()})
  };

  try {
    self.postMessage({inputId: inputId, msg: 'eval::start'})

    var result = eval(src);
    if (!result) {
      result = '-'
    }

    // we do not generally want to print the result of a function
    if (_.isFunction(result)) {
      result = '-'
    }

    self.postMessage({inputId: inputId, msg: 'result', data: result.toString()})
  }
  catch (error) {
    self.postMessage({inputId: inputId, msg: 'error', data: error.toString()})
  } finally {
    self.postMessage({inputId: inputId, msg: 'eval::end'})
  }
}

