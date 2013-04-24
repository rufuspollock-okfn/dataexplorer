this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.View = this.DataExplorer.View || {};

(function(my) {
"use strict";

my.Load = Backbone.View.extend({
  events: {
    'click .load-dataset': 'onLoadDataset',
    'submit form': 'onLoadDataset',
    'click .search-gdocs': '_onSearchGdocs',
    'click .tab-import .nav a': '_onImportTabClick'
  },

  onLoadDataset: function(e) {
    var self = this;
    e.preventDefault();
    var $form = $(e.target).closest('form');
    // var url = $form.find("input[name=source]").first().val();
    var data = {
    };
    _.each($form.serializeArray(), function(item) {
      data[item.name] = item.value;
    });
    // try to set name
    if (data.url) {
      if (data.backend != 'gdocs') {
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
    this.project.save();
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

  _onSearchGdocs: function(e) {
    var self = this;
    e.preventDefault();
    // Create and render a Picker object for searching images.
    var picker = new google.picker.PickerBuilder()
      .disableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .addView(google.picker.ViewId.SPREADSHEETS )
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);

    function pickerCallback(data) {
      var url = 'nothing';
      if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var doc = data[google.picker.Response.DOCUMENTS][0];
        url = doc[google.picker.Document.URL];
        self.$el.find('#gdocs input[name="url"]').val(url);
        self.$el.find('#gdocs form').submit();
      }
    }
  },
  
  template: ' \
    <div class="view load"> \
      <h3>Create a project by importing data</h3> \
      <hr /> \
      <div class="tabbable tabs-left tab-import"> \
        <ul class="nav nav-tabs"> \
          <li class="active"><a href="#gdocs">Google Docs Spreadsheet</a></li>  \
          <li><a href="#csv-disk">This computer</a></li>  \
          <li><a href="#csv-online">CSV online</a></li>  \
          <li><a href="#paste">Copy &amp; Paste</a></li>  \
          <li><a href="#github">Github (JSON or CSV)</a></li>  \
        </ul> \
        <div class="tab-content"> \
          <div id="gdocs" class="tab-pane active"> \
            <div class="alert alert-warning"> \
              <strong>Note:</strong> To load a spreadsheet it must have been <strong>"published"</strong> (to do this go to: File Menu -> Publish to the Web) \
            </div> \
            <p><a href="#" class="search-gdocs btn btn-primary">Select Spreadsheet in Google Docs &raquo;<br />(Opens file picker)</a></p> \
            <p><strong>Or paste the url directly</strong></p> \
            <form class="form"> \
              <input type="hidden" name="backend" value="gdocs" /> \
              <fieldset> \
                <input type="text" name="url" class="input span6" placeholder="URL to sheet" /> \
                <br /> \
                <button type="submit" class="btn btn-success load-dataset">Load</button> \
              </fieldset> \
            </form> \
          </div> \
          <div id="csv-disk" class="tab-pane fade"> \
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
                  <input type="text" name="delimiter" value="," class="input-mini" /> \
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
          <div id="csv-online" class="tab-pane fade"> \
            <form class="form-horizontal"> \
              <input type="hidden" name="backend" value="csv" /> \
              <fieldset> \
                <div class="control-group"> \
                  <label for="url" class="control-label">URL</label> \
                  <div class="controls"> \
                    <input type="text" name="url" class="input span6" placeholder="URL to CSV" /> \
                    <p class="help-block"> \
                      The CSV must either be on the same server or on a domain that supports cross domain requests (via CORS) \
                    </p> \
                  </div> \
                </div> \
              </fieldset> \
              <div class="form-actions"> \
                <button type="submit" class="btn btn-primary load-dataset">Load</button> \
              </div> \
            </form> \
          </div> \
          <div id="paste" class="tab-pane fade"> \
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
                    <input type="text" name="delimiter" value="," class="input-mini" /> \
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
          <div id="github" class="tab-pane fade"> \
            <form class="form-horizontal"> \
              <input type="hidden" name="backend" value="github" /> \
              <fieldset> \
                <div class="control-group"> \
                  <label for="url" class="control-label">URL</label> \
                  <div class="controls"> \
                    <input type="text" name="url" class="input span6" placeholder="URL to CSV on GitHub" value="https://github.com/datasets/transformer-test/blob/master/data/data.csv" /> \
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
