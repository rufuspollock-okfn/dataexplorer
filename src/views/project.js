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
    // globals is a hash { 'name-in-context': variable }
    var globals = '_';
    this._runCodeMirrorCodeSandboxed(this.editor, this.$output, globals);
  },

  // editor = codemirror editor
  // output = output area
  _runCodeMirrorCodeSandboxed: function(editor, output, globals) {
  return function(event) {

    // save the default logging behavior.
    var real_console_log = console.log;
    
    // save the default logging behavior.
    // Following Dean Edward's fantastic sandbox code:
    // http://dean.edwards.name/weblog/2006/11/sandbox/+evaluating+js+in+an+iframe
    // create an iframe sandbox for this element.
    var iframe = $("<iframe>")
      .css("display", "none")
      .appendTo($(document).find('body'));

    // Overwrite the default log behavior to pipe to an output element.
    console.log = function() {
      var messages = [];
      // Convert all arguments to Strings (Objects will be JSONified).
      for (var i = 0; i < arguments.length; i++) {
        var value = arguments[i];
        try {
          messages.push(typeof(value) == 'object' ? JSON.stringify(value) : String(value));
        } catch(e) {}
      }
      var msg = messages.join(" ");
      if (output.html() !== "") {
        output.append("<br />" + msg);
      } else {
        output.html(msg);
      }
    };

    var sandBoxMarkup = "<script>"+
      "var MSIE/*@cc_on =1@*/;"+ // sniff
      "console={ log: parent.console.log };" +
      "parent.sandbox=MSIE?this:{eval:function(s){return eval(s)}}<\/script>";

    if (globals) {
      for(
      var exposeGlobals = globals.split(",");

      $.each(exposeGlobals, function(prop, val) {
        val = $.trim(val);
        iframe[0].contentWindow[val] = window[val];
      });
      // define the dataset variable in the iframe ...
      iframe[0].contentWindow['dataset'] = window.app.instance.currentProject.dataset._store;
    }

    // write a script into the <iframe> and create the sandbox
    frames[frames.length - 1].document.write(sandBoxMarkup);

    var combinedSource = "";
    
    combinedSource += editor.getValue();
    
    // eval in the sandbox.
    sandbox.eval(combinedSource);

    // get rid of the frame. New Frame for every context.
    iframe.remove();
    
    // set the old logging behavior back.
    console.log = real_console_log;
  }();
}
});

}).apply(this, window.args);
