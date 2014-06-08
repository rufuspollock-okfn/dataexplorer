(function(my) {
"use strict";

my.Project = Backbone.View.extend({
  className: 'view project',
  template: ' \
    <div class="header-nav"> \
      <div class="round avatar"> \
        <i class="icon-file-text-alt"></i> \
      </div> \
      <div class="details"> \
        <h4 class="trail"> \
          <a href="/#{{username}}">{{username}}</a> / {{projectId}} \
        </h4> \
        <h2 class="project-name"> \
          <span class="js-edit-name">{{name}}</span> \
          {{#currentUserIsOwner}} \
          <sup><a href="#" class="js-edit-name-pencil" style="font-size: 14px;"><i class="icon-edit"></i></a></sup> \
          {{/currentUserIsOwner}} \
        </h2> \
      </div> \
      <div id="fork"> \
        {{#fork_of}} \
        <p class="muted"><small>Forked from <a href="{{fork_of}}">{{fork_of}}</a></small></p> \
        {{/fork_of}} \
      </div> \
    </div> \
    \
    <div class="right-menu"> \
      <ul class="nav"> \
        <li> \
          {{#currentUserIsOwner}} \
          <a class="btn-success round disabled js-save-button" title="All Saved" href="#"> \
            <i class="icon-save"></i> \
          </a> \
          {{/currentUserIsOwner}} \
        </li> \
        <li> \
          <a class="round js-show-script-editor" href="#" title="Show Scripting"><i class="icon-pencil"></i></a> \
        </li> \
        <li> \
          <a class="round js-show-readme" href="#" title="Show README">R</a> \
        </li> \
        <li> \
          {{^currentUserIsOwner}} \
          <a class="round forkme" \
            {{^authenticated}}disabled title="Sign in to fork"{{/authenticated}} \
            title="Fork this Project"> \
              <i class="icon-code-fork"></i> \
          </a> \
          {{/currentUserIsOwner}} \
        </li> \
        <li class="divider"></li> \
      </ul> \
      <ul class="nav"> \
        <li> \
          <a class="" target="_blank" href="{{gist.url}}/raw//current.csv" title="Download Data (as CSV)"><i class="icon-download-alt"></i></a> \
        </li> \
        <li> \
          <a class="" target="_blank" href="{{gist.url}}"><i class="icon-github-alt" title="See Github Gist for this Project"></i></a> \
        </li> \
        <li class="divider"></li> \
        <li> \
          <a class="" target="_blank" href="./doc/guide.html" \
            title="Guide and Help"> \
            <i class="icon-info-sign"></i> \
          </a> \
        </li> \
      </ul> \
    </div> \
    <div class="flash"></div> \
    \
    <div class="meta"> \
      <h3> \
        README \
        <button class="btn btn-small editreadme">Edit</button> \
      </h3> \
      <div class="readme"></div> \
      <div class="info"></div> \
    </div> \
    <div class="script-editor"></div> \
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
    'click .js-go-to-data': '_onGoToData',
    'click .forkme': 'forkProject',
    'click .top-row-toggle': '_toggleTopRow',
    'click .js-save-button': '_onSaveProject',
    'click .js-show-script-editor': '_toggleScriptEditor',
    'click .js-show-readme': '_toggleReadme'
  },

  initialize: function(options) {
    var self = this;
    this.state = _.extend({currentView: 'grid'}, options.state);

    this.listenTo(this.model.datasets.at(0), 'query:done', function() {
      self.$el.find('.doc-count').text(self.model.datasets.at(0).recordCount || 'Unknown');
    });
    this.listenTo(this.model.unsavedChanges, 'change', function(changes) {
      var $saveButton = self.$el.find('.js-save-button');
      $saveButton.find('i').attr('class', 'icon-save');
      // reset text which may have got set to 'Saving ...'
      if (changes.attributes.any) {
        $saveButton.attr('title', 'Save Changes');
        $saveButton.removeClass('disabled');
        window.onbeforeunload = function(e) {
          return 'You have UNSAVED changes to your project';
        }
      } else {
        $saveButton.attr('title', 'All Saved');
        $saveButton.addClass('disabled');
        window.onbeforeunload = null;
      }
    });

    // update view queryState on the current view
    this.listenTo(this.model.datasets.at(0), 'query:done', function() {
      var curr = self.model.get('views');
      var dirty = false;
      var newQS = self.model.datasets.at(0).queryState.toJSON();
      _.each(curr, function(viewModel, idx) {
        if (viewModel.id === self.state.currentView && !_.isEqual(viewModel.queryState, newQS)) {
          viewModel.queryState = newQS;
          dirty = true;
        }
      });
      if (dirty) {
        self.model.trigger('change:views');
        self.model.trigger('change');
      }
    });
  },

  render: function() {
    var self = this;
    var tmplData = this.model.toJSON();
    if (this.model.fork_of) {
      tmplData.fork_of = "#" + this.model.fork_of.owner + "/" + this.model.fork_of.id;
    }
    // TODO: probably normalize this further up the line ...
    // gist id for gist based projects and project id otherwise
    tmplData.projectId = tmplData.gist ? tmplData.gist.id : tmplData.id;
    tmplData.currentUserIsOwner = this.model.currentUserIsOwner;
    tmplData.authenticated = window.authenticated;
    var tmpl = Mustache.render(this.template, tmplData);
    this.$el.html(tmpl);

    // Alter UI if user isn't the owner
    this.$el.find(".editreadme").toggle(this.model.currentUserIsOwner);

    if (this.model.currentUserIsOwner) {
      $('.js-edit-name').editable({
        placement:'bottom',
        mode: 'inline',
        toggle: 'manual',
        inputclass: 'span5',
        success: function (resp, newValue) {
          self.model.set("name", newValue);
        }
      });
      $('.js-edit-name-pencil').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.js-edit-name').editable('toggle');
      });
    }

    var $dataViewContainer = this.$el.find('.data-view-container');
    var $dataSidebar = this.$el.find('.data-view-sidebar');

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
      self.listenTo(out.view.state, 'change', function() {
        var curr = self.model.get('views');
        // update the view info on the model corresponding to the one being changed
        _.each(curr, function(viewModel) {
          if (viewModel.id === out.id) {
            viewModel.state = out.view.state.toJSON();
          }
        });
        self.model.trigger('change:views');
        self.model.trigger('change');
      });

      return out;
    });

    this.readme = new DataExplorer.View.ReadmeView({
      el: this.$el.find(".meta")[0],
      model: this.model
    });
    this.readme.render();

    var pager = new recline.View.Pager({
      model: this.model.datasets.at(0)
    });
    this.$el.find('.recline-results-info').after(pager.el);

    var queryEditor = new recline.View.QueryEditor({
      model: this.model.datasets.at(0).queryState
    });
    this.$el.find('.query-editor-here').append(queryEditor.el);

    // see below!
    var width = this.$el.find('.multiview-here').width();

		this.editor = new DataExplorer.View.ScriptEditor({
      model: this.model
    });

    this.$el.find('.script-editor').append(this.editor.el);
    this.editor.render();

    // HACK - for some reason the grid view of multiview is massively wide by default
    this.$el.find('.view.project .recline-data-explorer').width(width);

    // set the current view
    this._updateNav(this.state.currentView);

    this.$el.find(".top-row").splitter({
      minLeft: 250,
      minRight: 250,
      resizeToWidth: true
    });

    return this;
  },

  remove: function () {
    _.each(this.views, function (view) {
      if (view.view.elSidebar) view.view.elSidebar.remove();
      view.view.remove();
    });
    this.editor.remove();
    this.readme.remove();
    Backbone.View.prototype.remove.apply(this, arguments);
  },

  _onMenuClick: function(e) {
    e.preventDefault();
    var action = $(e.target).attr('data-action');
    this.$el.find('.' + action).toggle('slow');
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
    this.$el.find('.navigation a').removeClass('active');
    this.$el.find('.navigation a[data-view="' + pageName + '"]').addClass('active');
    // show the specific page
    _.each(this.views, function(view, idx) {
      if (view.id === pageName) {
        view.view.$el.show();
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
        view.view.$el.hide();
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
  },

  _onSaveProject: function(e) {
    e.preventDefault();
    this.$el.find('.js-save-button i').attr('class', 'icon-spinner icon-spin');
    this.model.save()
      .done(function(e) {
      })
      .fail(function(e) {
        alert('There was an error'); 
      })
      ;
  },

  _toggleScriptEditor: function (e) {
    e.preventDefault();
    $('.script-editor').slideToggle();
    // need to call refresh for stuff to properly show
    var $el = this.$el.find('.script-editor .CodeMirror')[0];
    $el.CodeMirror.refresh();
  },

  _toggleReadme: function (e) {
    e.preventDefault();
    $('.meta').slideToggle();
  },

  forkProject: function () {
    var gh = DataExplorer.Model.github();
    gh.getGist(this.model.gist_id).fork(function (err, gist) {
      var newpath = "#" + gist.user.login + "/" + gist.id;
      DataExplorer.app.instance.router.navigate(newpath, {trigger: true});
    });
  }
});

my.ScriptEditor = Backbone.View.extend({
  template: ' \
    <div class="header"> \
      <h4>Scripting</h4> \
      <div class="buttons"> \
        <a class="btn btn-small btn-primary runsandbox"><i class="icon-play-circle"></i> Run</a> \
        <a class="btn btn-small btn-danger clear">Clear Output</a> \
        <a class="btn btn-small" title="Scripting Help and Tutorials (opens in new window)" target="_blank" href="./doc/scripting.html"><i class="icon-info-sign"></i> Help</a> \
      </div> \
    </div> \
    <div class="script-editor-widget"> \
      <textarea class="content"></textarea> \
    </div> \
    <div class="output"></div> \
  ',
  events: {
    'click a.clear': '_onClear',
    'click a.runsandbox': '_onRunSandboxed'
  },

  initialize: function(options) {
    this.editor = null;
    this.$output = null;
    this.script = this.model.scripts.get('main.js');
    this.dataset = this.model.datasets.at(0);
    this.original_dataset = this.model.datasets.at(1);
    this.widgets = [];
    _.bindAll(this, "_updateHints");
  },

  render: function() {
    this.$el.html(this.template);
    var $textarea = this.$el.find('textarea.content');
    $textarea.val(this.script.get('content'));
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

    var waiting;
    var updateHints = this._updateHints;
    this.editor.on("change", function() {
      clearTimeout(waiting);
      waiting = setTimeout(updateHints, 1000);
    });

    setTimeout(updateHints, 100);
  },

  _updateHints: function () {
    var editor = this.editor;
    var widgets = this.widgets;
    editor.operation(function(){
      for (var i = 0; i < widgets.length; ++i)
        editor.removeLineWidget(widgets[i]);
      widgets.length = 0;

      JSHINT(editor.getValue(), {asi: true});
      for (var i = 0; i < JSHINT.errors.length; ++i) {
        var err = JSHINT.errors[i];
        if (!err) continue;
        var msg = document.createElement("div");
        var icon = msg.appendChild(document.createElement("i"));
        icon.className = "icon-info-sign icon-white";
        msg.appendChild(document.createTextNode(err.reason));
        msg.className = "lint-error";
        widgets.push(editor.addLineWidget(err.line - 1, msg, {coverGutter: false, noHScroll: true}));
      }
    });
    var info = editor.getScrollInfo();
    var after = editor.charCoords({line: editor.getCursor().line + 1, ch: 0}, "local").top;
    if (info.top + info.clientHeight < after)
      editor.scrollTo(null, after - info.clientHeight + 3);
  },

  _onClear: function(e) {
    this.$output.html('');
  },

  _onRunSandboxed: function(e) {
    var self = this;
    // save the script ...
    this.script.set({content: this.editor.getValue()});
    var worker = new Worker('src/views/worker-runscript.js');
    worker.addEventListener('message',
        function(e) { self._handleWorkerCommunication(e); },
        false);
    var codeToRun = this.editor.getValue();

    var post = function () {
      worker.postMessage({
        src: codeToRun,
        datasets: {
          current: {
            records: self.dataset._store.records,
            fields: self.dataset._store.fields
          },
          original: {
            records: self.original_dataset._store.records,
            fields: self.original_dataset._store.fields
          }
        }
      });
    };

    if (this.original_dataset.recordCount === null) {
      this.original_dataset.fetch().done(post);
    } else {
      post();
    }

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
      this.dataset.trigger('change');
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
    _.bindAll(this, "render");
    this.showdown = new Showdown.converter();
    this.listenTo(this.model, "change:readme", this.render);
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
      lineNumbers: true,
      lineWrapping: true,
      theme : "default",
      mode : "markdown",
      value: this.model.get("readme")
    };
    this.editor = CodeMirror(this.el, options);
    this.editor.focus();

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
