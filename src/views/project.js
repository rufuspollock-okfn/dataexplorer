(function(config, models, views, routers, utils, templates) {

views.Project = Backbone.View.extend({
  template: ' \
    <div class="view project"> \
      <div class="menu"> \
        &nbsp; \
        <div class="btn-group rhs" data-toggle="buttons-checkbox"> \
          <a href="#" data-action="script-editor" class="btn">Script Editor</a> \
        </div> \
      </div> \
      <div class="script-editor"></div> \
      <div class="multiview-here"></div> \
    </div> \
  ',
  events: {
    'click .menu a': '_onMenuClick'
  },

  initialize: function(options) {
    this.el = $(this.el);
  },

  render: function() {
    this.el.html(this.template);
    var reclineviews = [
       {
         id: 'grid',
         label: 'Grid', 
         view: new recline.View.SlickGrid({
           model: this.model.dataset
         })
       },
       {
         id: 'map',
         label: 'Map',
         view: new recline.View.Map({
           model: this.model.dataset
         })
       },
       {
         id: 'graph',
         label: 'Graph',
         view: new recline.View.Graph({
           model: this.model.dataset
         })
       }
    ];

    // see below!
    var width = this.el.find('.multiview-here').width();

		this.grid = new recline.View.MultiView({
      el: this.el.find('.multiview-here'),
      model: this.model.dataset,
      views: reclineviews,
      sidebarViews: []
    });
		this.editor = new views.ScriptEditor({
      model: this.model.scripts.get('main.js')
    });

    this.el.find('.script-editor').append(this.editor.el);
    this.editor.render();

    // now hide this element for the moment
    this.editor.el.parent().hide();

		this.model.dataset.query();

    // HACK - for some reason the grid view of multiview is massively wide by default
    this.el.find('.view.project .recline-data-explorer').width(width);

    return this;
  },

  _onMenuClick: function(e) {
    e.preventDefault();
    var action = $(e.target).attr('data-action');
    this.el.find('.' + action).toggle('slow');
  }
});


// The runnable CodeMirror work is largely based on Irene Ros' great deck.js +
// codemirror work (MIT licensed!). Thanks Irene!
// https://github.com/iros/deck.js-codemirror/blob/1.0.0rc/deck.codemirror.js
views.ScriptEditor = Backbone.View.extend({
  template: ' \
    <div class="script-editor-widget"> \
      <div class="button runsandbox">Run in Sandbox</div> \
      <div class="button clear">Clear Output</div> \
      <div class="output"></div> \
      <textarea class="content"></textarea> \
    </div> \
  ',
  events: {
    'click .button.clear': '_onClear',
    'click .button.runsandbox': '_onRunSandboxed'
  },

  initialize: function(options) {
    this.el = $(this.el);
    this.editor = null;
    this.$output = null;
  },

  render: function() {
    this.el.html(this.template);
    var $textarea = this.el.find('textarea.content');
    $textarea.val(this.model.get('content'));
    // enable codemirror
    var options = {
      lineNumbers : true,
      theme : "default",
      mode : "javascript",
      theme : "default",
      indentUnit : 2,
      indentWithTabs : false,
      tabMode: "shift",
      runnable : true
    };
    this.editor = CodeMirror.fromTextArea($textarea[0], options);
    this.$output = $('.output');
  },

  _onClear: function(e) {
    this.$output.html('');
  },

  _onRunSandboxed: function(e) {
    var self = this;
    // save the script ...
    this.model.set({content: this.editor.getValue()});
    var worker = new Worker('src/views/worker-runscript.js');
    worker.addEventListener('message',
        function(e) { self._handleWorkerCommunication(e) },
        false);
    var codeToRun = this.editor.getValue();
    worker.postMessage({src: codeToRun}); // Send data to our worker.
  },

  _handleWorkerCommunication: function(e) {
    var self = this;
    if (e.data.msg == 'print') {
      this._writeToOutput(e.data.data);
    } else if (e.data.msg == 'error') {
      this._writeToOutput(e.data.data, 'error');
    }
    // console.log('Worker said: ', e.data);
  },

  _writeToOutput: function(msg, type) {
    // make it a bit safer ...
    msg = msg.replace('<', '&lt;').replace('>', '&gt;');
    if (type === 'error') {
      msg = '<span class="error"><strong>Error: </strong>' + msg + '</span>';
    }
    msg += '<br />';
    this.$output.append(msg);
  }
});

}).apply(this, window.args);
