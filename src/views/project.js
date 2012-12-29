(function(config, models, views, routers, utils, templates) {

views.Project = Backbone.View.extend({
  events: {
  },

  initialize: function(options) {
    this.el = $(this.el);
  },

  render: function() {
    this.el.html(this.template);
    var views = [
       {
         id: 'grid',
         label: 'Grid', 
         view: new recline.View.SlickGrid({
           model: this.model
         })
       },
       {
         id: 'map',
         label: 'Map',
         view: new recline.View.Map({
           model: this.model
         })
       },
       {
         id: 'graph',
         label: 'Graph',
         view: new recline.View.Graph({
           model: this.model
         })
       }
    ];

    // see below!
    var width = this.el.find('.multiview-here').width();

		this.grid = new recline.View.MultiView({
      el: this.el.find('.multiview-here'),
      model: this.model,
      views: views
    });
		this.editor = new recline.View.Transform({model: this.model });

    this.el.find('#editor').append(this.editor.el);
    this.editor.render();
    // enable codemirror
    var $textarea = $('textarea.expression-preview-code')[0];
    codemirrorify($textarea);

		this.model.query();

    // HACK - for some reason the grid view of multiview is massively wide by default
    this.el.find('.view.project .recline-data-explorer').width(width);

    return this;
  },

  template: ' \
    <div class="view project"> \
      <div class="tabbable"> \
        <ul class="nav nav-tabs"> \
          <li class="active"> \
            <a href="#grid" data-toggle="tab" class="grid-selector">Grid</a> \
            </li> \
          <li> \
            <a href="#transformations" data-toggle="tab">Transformations</a> \
          </li> \
        </ul> \
        <div class="tab-content"> \
          <div class="tab-pane active" id="grid"> \
            <div class="multiview-here"></div> \
          </div> \
          <div class="tab-pane" id="transformations"> \
            <div id="editor"></div> \
          </div> \
        </div> \
      </div> \
    </div> \
  '
});


// Direct copy (with a few tweaks) of Irene Ros' great deck.js + codemirror work
// https://github.com/iros/deck.js-codemirror/blob/1.0.0rc/deck.codemirror.js

var cmopts = {
  classes: {
    codemirror: 'deck-codemirror',
    codemirrorresult: 'codemirror-result'
  },
  
  selectors: {
    codemirroritem: '.code',
  },

  data : {
    codemirrorified: 'codemirrorified'
  },
  codemirror : {
    lineNumbers : true,
    theme : "default",
    mode : "javascript",
    theme : "default",
    indentUnit : 2,
    indentWithTabs : false,
    tabMode: "shift",
    runnable : true
  }
};

// a helper private function that can be used to "codemirror" a codeblock (textarea element) 
var codemirrorify = function(codeblock) {
  // initialize defaults.
  var codeblock = $(codeblock),
      editor    = null,
      options   = $.extend(cmopts.codemirror,
        {
          mode : !!codeblock.attr('mode') ? codeblock.attr('mode') : cmopts.codemirror.mode,
          theme : !!codeblock.attr('theme') ? codeblock.attr('theme') : cmopts.codemirror.theme,
          onFocus : function(e) {
            inEditor = true;
          },
          onBlur : function(e) {
            inEditor = false;
          }
        }
      );

  // if this is a textarea just use the codemirror shorthand.
  if (codeblock.get(0).nodeName.toUpperCase() === "TEXTAREA") {
    editor = CodeMirror.fromTextArea(codeblock[0], options);
  } else {
    // else codemirror the element's content and attach to element parent. 
    var parent  = codeblock.parent();
    codeblock.hide();
    editor      = CodeMirror(parent[0], 
      $.extend(options, {
        value : codeblock.html()
      })
    );
  }

  if (cmopts.codemirror.runnable || codeblock.attr("runnable")) {
    // make the code runnable
    var wrapper = editor.getWrapperElement(),
        button  = $('<div>', {
          "class" : "button",
          text : "Run in Sandbox"
        }).prependTo(wrapper),
        clearButton  = $('<div>', {
          "class" : "button clear",
          text : "Clear Output"
        }).prependTo(wrapper),
        output = $('<div>', {
          "class" : cmopts.classes.codemirrorresult
        }).appendTo($(wrapper).parent());

    clearButton.click(function(editor, output){
      return function(event) {
        output.html('');
      };
    }(editor, output));

    // TODO: make this *much* cleaner ...
    // var globals = $(codeblock).attr("globals");
    var globals = '_';
    button.click(function() {
      return runCodeMirrorCodeSandboxed(editor, output, globals)
    });
  }
}

// editor = codemirror editor
// output = output area
function runCodeMirrorCodeSandboxed(editor, output, globals) {
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
  }(editor, output);
};


}).apply(this, window.args);
