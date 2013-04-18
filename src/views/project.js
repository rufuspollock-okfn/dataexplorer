(function(my) {
"use strict";

my.Project = Backbone.View.extend({
  className: 'view project',
  template: ' \
    <div class="row-fluid"> \
      <h4 class="span6">Description</h4> \
      <h4 class="span6">Code</h4> \
    </div> \
    <div class="top-row row-fluid"> \
      <div class="meta span6"> \
        <button class="btn btn-small editreadme">Edit</button> \
        <div class="readme"></div> \
      </div> \
      <div class="script-editor span6"></div> \
    </div> \
    <hr /> \
    <div id="data-app" class="data-app"> \
      <div class="header"> \
        <div class="navigation"> \
          <div class="btn-group" data-toggle="buttons-radio"> \
          {{#views}} \
          <a href="#{{id}}" data-view="{{id}}" class="btn">{{label}}</a> \
          {{/views}} \
          </div> \
        </div> \
        <div class="recline-results-info"> \
          <span class="doc-count">{{recordCount}}</span> records\
        </div> \
        <div class="query-editor-here" style="display:inline;"></div> \
      </div> \
      <div class="data-view-sidebar"></div> \
      <div class="data-view-container"></div> \
      <div class="multiview-here"></div> \
    </div> \
  ',
  events: {
    'click .menu-right a': '_onMenuClick',
    'click .navigation a': '_onSwitchView',
    'click .js-go-to-data': '_onGoToData'
  },

  initialize: function(options) {
    var self = this;
    this.el = $(this.el);
    this.state = _.extend({currentView: 'grid'}, options.state);

    this.model.datasets.at(0).bind('query:done', function() {
      self.el.find('.doc-count').text(self.model.datasets.at(0).recordCount || 'Unknown');
    });

    // update view queryState on the current view
    this.model.datasets.at(0).bind('query:done', function() {
      var curr = self.model.get('views');
      _.each(curr, function(viewModel, idx) {
        if (viewModel.id == self.state.currentView) {
          viewModel.queryState = self.model.datasets.at(0).queryState.toJSON();
          curr[idx] = viewModel;
        }
      });
      self.model.set('views', curr);
      // change is not being triggered for some reason ...
      self.model.trigger('change');
      self.model.trigger('change:views');
    });
  },

  render: function() {
    var self = this;
    var tmplData = this.model.toJSON();
    var tmpl = Mustache.render(this.template, tmplData);
    this.el.html(tmpl);

    var $dataViewContainer = this.el.find('.data-view-container');
    var $dataSidebar = this.el.find('.data-view-sidebar');

    // create the Views (graphs, maps etc)
    this.views = _.map(this.model.get('views'), function(viewInfo) {
      var out = _.clone(viewInfo);
      out.view = new recline.View[viewInfo.type]({
        model: self.model.datasets.at(0),
        state: viewInfo.state
      });

      // render and insert into DOM
      out.view.render();
      $dataViewContainer.append(out.view.el);
      if (out.view.elSidebar) {
        $dataSidebar.append(out.view.elSidebar);
      }

      // now bind state changes so they get saved ...
      out.view.state.bind('change', function() {
        var curr = self.model.get('views');
        // update the view info on the model corresponding to the one being changed
        _.each(curr, function(viewModel) {
          if (viewModel.id == out.id) {
            viewModel.state = out.view.state.toJSON();
          }
        });
        self.model.set('views', curr);
        // change is not being triggered for some reason ...
        self.model.trigger('change');
        self.model.trigger('change:views');
      });

      return out;
    });

    var readme = new DataExplorer.View.ReadmeView({
      el: this.el.find(".meta")[0],
      model: this.model
    });
    readme.render();

    var pager = new recline.View.Pager({
      model: this.model.datasets.at(0).queryState
    });
    this.el.find('.recline-results-info').after(pager.el);

    var queryEditor = new recline.View.QueryEditor({
      model: this.model.datasets.at(0).queryState
    });
    this.el.find('.query-editor-here').append(queryEditor.el);

    // see below!
    var width = this.el.find('.multiview-here').width();

		this.editor = new DataExplorer.View.ScriptEditor({
      model: this.model.scripts.get('main.js')
    });
    // TODO: hmmm, this is not that elegant ...
    this.editor.dataset = this.model.datasets.at(0);

    this.el.find('.script-editor').append(this.editor.el);
    this.editor.render();

    // HACK - for some reason the grid view of multiview is massively wide by default
    this.el.find('.view.project .recline-data-explorer').width(width);

    // set the current view
    this._updateNav(this.state.currentView);

    return this;
  },

  _onMenuClick: function(e) {
    e.preventDefault();
    var action = $(e.target).attr('data-action');
    this.el.find('.' + action).toggle('slow');
  },

  _onSwitchView: function(e) {
    e.preventDefault();
    var viewName = $(e.target).attr('data-view');
    this._updateNav(viewName);
  },

  _updateNav: function(pageName) {
    this.state.currentView = pageName;
    var view = _.filter(this.model.get('views'), function(view) {return (view.id === pageName); })[0];
    if (view.queryState) {
      this.model.datasets.at(0).query(view.queryState);
    } else {
      this.model.datasets.at(0).query({size: this.model.datasets.at(0).recordCount});
    }
    this.el.find('.navigation a').removeClass('active');
    var $el = this.el.find('.navigation a[data-view="' + pageName + '"]');
    $el.addClass('active');
    // show the specific page
    _.each(this.views, function(view, idx) {
      if (view.id === pageName) {
        view.view.el.show();
        if (view.view.elSidebar) {
          view.view.elSidebar.show();
        }
        if (view.view.show) {
          view.view.show();
        }
        // update the url / route to show just this view
        // HACK
        var current = Backbone.history.fragment;
        var newpath = current.split('/view')[0] + '/view/' + pageName;
        if (current.indexOf('/view')!= -1) {
          DataExplorer.app.instance.router.navigate(newpath);
        } else {
          // we are on the default view so need to explicitly navigate - just replace
          DataExplorer.app.instance.router.navigate(newpath, {replace: true});
        }
      } else {
        view.view.el.hide();
        if (view.view.elSidebar) {
          view.view.elSidebar.hide();
        }
        if (view.view.hide) {
          view.view.hide();
        }
      }
    });
  },

  _onGoToData: function(e) {
    e.preventDefault();
    $('html,body').animate({
        // the navbar takes up 60px so have to subtract it
        scrollTop: $('#data-app').offset().top - 60
      }
    );
  }
});


my.ScriptEditor = Backbone.View.extend({
  template: ' \
    <button class="btn btn-small btn-primary runsandbox">Run the Code</button> \
    <button class="btn btn-small btn-danger clear">Clear Output</button> \
    <div class="script-editor-widget"> \
      <textarea class="content"></textarea> \
    </div> \
    <div class="output"></div> \
  ',
  events: {
    'click button.clear': '_onClear',
    'click button.runsandbox': '_onRunSandboxed'
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
        function(e) { self._handleWorkerCommunication(e); },
        false);
    var codeToRun = this.editor.getValue();
    worker.postMessage({
      src: codeToRun,
      dataset: {
        records: this.dataset._store.records,
        fields: this.dataset._store.fields
      }
    });
  },

  _handleWorkerCommunication: function(e) {
    var self = this;
    if (e.data.msg == 'print') {
      this._writeToOutput(e.data.data);
    } else if (e.data.msg == 'error') {
      this._writeToOutput(e.data.data, 'error');
    } else if (e.data.msg == 'saveDataset') {
      this.dataset._store.records = e.data.records;
      this.dataset._store.fields = e.data.fields;
      this.dataset.fields.reset(this.dataset._store.fields);
      this.dataset.query({size: this.dataset._store.records.length});
    }
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

my.ReadmeView = Backbone.View.extend({
  events: {
    "click .editreadme": "edit",
    "click .savereadme": "save"
  },
  initialize: function () {
    this.showdown = new Showdown.converter();
    this.model.on("change:readme", this.render, this);
  },
  render: function () {
    var readme = this.showdown.makeHtml(this.model.get("readme"));
    readme = readme.replace(/--/g, '&mdash;');
    this.$el.find(".readme").html(readme);
    return this;
  },
  edit: function () {
    this.$el.find(".readme").hide();

    var options = {
      lineWrapping: true,
      theme : "default",
      mode : "markdown",
      value: this.model.get("readme")
    };
    this.editor = CodeMirror(this.el, options);

    this.$el.find(".editreadme").text("Save").addClass("btn-success savereadme").removeClass("editreadme");
  },
  save: function () {
    this.model.set("readme", this.editor.getValue());
    $(this.editor.getWrapperElement()).remove();
    this.$el.find(".readme").show();
    this.$el.find(".savereadme").text("Edit").removeClass("btn-success savereadme").addClass("editreadme");
  }
});

}(this.DataExplorer.View));
