this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.View = this.DataExplorer.View || {};

(function(my) {
"use strict";

my.Load = Backbone.View.extend({
  events: {
    'submit form': 'onLoadDataset',
    'click .tab-import .nav a': '_onImportTabClick'
  },

  onLoadDataset: function(e) {
    var self = this;
    e.preventDefault();
    var $form = $(e.target).closest('form');
    var data = {};
    _.each($form.serializeArray(), function(item) {
      data[item.name] = item.value;
    });
    // try to set name
    if (data.url) {
 
      if (data.url.match(/^https?:\/\/github.com/)) {
        data.backend = "github";
      } else if (data.url.match(/^https?:\/\/docs.google.com/)) {
        data.backend = "gdocs";
      }

      if (data.backend !== 'gdocs') {
        data.name = data.url.split('/')
          .pop()
          .split('.')[0];
      }
    }
    // special case for file form
    var $files = $form.find('input[type="file"]');
    if ($files.length > 0) {
      data.file = $files[0].files[0];
      // TODO: size, type, lastModified etc - https://developer.mozilla.org/en-US/docs/DOM/File
      data.name = data.file.name.split('.')[0];
    }
    // TODO: gdocs spreadsheet (could get this from picker but prefer to wait
    // for preview code when we can do this properly)
    var projectName = 'No name';
    if (data.name) {
      projectName = data.name.replace('_', ' ').replace('-', ' ');
    }
    this.project = new DataExplorer.Model.Project({
      name: projectName,
      datasets: [data]
    });
    // this.project.save();
    self.trigger('load', this.project);
    return false;
  },

  render: function() {
    var rendered = _.template(this.template, {});
    this.$el.html(rendered);
    return this;
  },

  _onImportTabClick: function(e) {
    e.preventDefault();
    $(e.target).tab('show');
  },
  
  template: ' \
    <div class="view load"> \
      <h3>Create a project by importing data</h3> \
      <hr /> \
      <div class="tabbable tabs-left tab-import"> \
        <ul class="nav nav-tabs"> \
          <li class="active"><a href="#csv-online">Online</a></li>  \
          <li><a href="#csv-disk">Upload</a></li>  \
          <li><a href="#paste">Paste</a></li>  \
        </ul> \
        <div class="tab-content"> \
          <div id="csv-disk" class="tab-pane"> \
            <form class="form-horizontal"> \
              <input type="hidden" name="backend" value="csv" /> \
              <div class="control-group"> \
                <label class="control-label">File</label> \
                <div class="controls"> \
                  <input type="file" name="file" /> \
                </div> \
              </div> \
              <div class="control-group"> \
                <label class="control-label">Separator</label> \
                <div class="controls"> \
                  <select name="delimiter" class="input-small"> \
                    <option value="," selected>Comma</option> \
                    <option value="&#09;">Tab</option> \
                    <option value=" ">Space</option> \
                    <option value=";">Semicolon</option> \
                  </select> \
                </div> \
              </div> \
              <div class="control-group"> \
                <label class="control-label">Text delimiter</label> \
                <div class="controls"> \
                  <input type="text" name="quotechar" value=\'"\' class="input-mini" /> \
                </div> \
              </div> \
              <div class="control-group"> \
                <label class="control-label">Encoding</label> \
                <div class="controls"> \
                  <input type="text" name="encoding" value="UTF-8" class="input-mini" /> \
                </div> \
              </div> \
              <div class="form-actions"> \
                <button type="submit" class="btn btn-primary load-dataset">Load</button> \
              </div> \
            </form> \
          </div> \
          <div id="csv-online" class="tab-pane active"> \
            <form class="form-horizontal"> \
              <input type="hidden" name="backend" value="csv" /> \
              <fieldset> \
                <div class="control-group"> \
                  <label for="url" class="control-label">URL</label> \
                  <div class="controls"> \
                    <input type="url" name="url" class="input span6" placeholder="URL to CSV or a published Google Spreadsheet" /> \
                  </div> \
                </div> \
              </fieldset> \
              <div class="form-actions"> \
                <button type="submit" class="btn btn-primary load-dataset">Load</button> \
              </div> \
            </form> \
          </div> \
          <div id="paste" class="tab-pane"> \
            <form class="form-horizontal"> \
              <input type="hidden" name="backend" value="csv" /> \
              <fieldset> \
                <div class="control-group"> \
                  <label for="data" class="control-label">Data</label> \
                  <div class="controls"> \
                    <textarea name="data" class="input-block-level" rows="10" placeholder="Paste CSV data into here" /> \
                  </div> \
                </div> \
                <div class="control-group"> \
                  <label class="control-label">Separator</label> \
                  <div class="controls"> \
                    <select name="delimiter" class="input-small"> \
                      <option value="," selected>Comma</option> \
                      <option value="&#09;">Tab</option> \
                      <option value=" ">Space</option> \
                      <option value=";">Semicolon</option> \
                    </select> \
                  </div> \
                </div> \
                <div class="control-group"> \
                  <label class="control-label">Text delimiter</label> \
                  <div class="controls"> \
                    <input type="text" name="quotechar" value=\'"\' class="input-mini" /> \
                  </div> \
                </div> \
              </fieldset> \
              <div class="form-actions"> \
                <button type="submit" class="btn btn-primary load-dataset">Load</button> \
              </div> \
            </form> \
          </div> \
        </div><!-- /tab-content -->  \
      </div><!-- /tabbable -->  \
    </div> \
  '
});

}(this.DataExplorer.View));
