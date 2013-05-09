this.DataExplorer = this.DataExplorer || {};
this.DataExplorer.View = this.DataExplorer.View || {};

(function(my) {
"use strict";

my.Load = Backbone.View.extend({
  events: {
    'submit form': 'onLoadDataset',
    'click .tab-import .nav a': '_onImportTabClick',
    'click .gdrive-import': '_onSearchGdocs',
    'change input[type=url]': '_checkUrl'
  },

  _checkUrl: function (e) {
    // NB: setCustomValidity primes the error messages ready for form submission,
    //     it doesn't show them immediately.
    var url = e.target.value;
    var backend = this._guessBackend(url);

    if (backend === "github") {
      // We arent't testing these just now
      e.target.setCustomValidity("");
      return;
    } else if (backend === "gdocs") {
      url = recline.Backend.GDocs.getGDocsAPIUrls(url).spreadsheet;
    }

    $.ajax(url, {
      type: "HEAD",
      success: function (jqXHR) {
        e.target.setCustomValidity("");
      },
      error: function (jqXHR, textStatus) {
        var error;
        if (jqXHR.status === 404) {
          error = "That URL doesn't exist";
        } else {
          error = "We could not retrieve this URL";
          if (backend === "gdocs") {
            error += ". Have you published this spreadsheet?";
          }
        }
        e.target.setCustomValidity(error);
      }
    });
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

      data.backend = this._guessBackend(data.url);

      if (data.backend !== 'gdocs') {
        data.id= data.url.split('/')
          .pop()
          .split('.')[0];
      }
    }
    // special case for file form
    var $files = $form.find('input[type="file"]');
    if ($files.length > 0) {
      data.file = $files[0].files[0];
      // TODO: size, type, lastModified etc - https://developer.mozilla.org/en-US/docs/DOM/File
      data.id = data.file.name.split('.')[0];
    }
    // TODO: gdocs spreadsheet (could get this from picker but prefer to wait
    // for preview code when we can do this properly)
    var projectName = '';
    if (data.id) {
      projectName = data.id;
      data.id= data.id.replace(/_/g, ' ').replace(/-/g, ' ');
    } else {
      data.id = 'data';
      projectName = 'No name';
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

  _guessBackend: function (url) {
    var backend = 'csv';
    if (url.match(/^https?:\/\/github.com/)) {
      backend = "github";
    } else if (url.match(/^https?:\/\/docs.google.com/)) {
      backend = "gdocs";
    }
    return backend;
  },

  _onImportTabClick: function(e) {
    e.preventDefault();
    $(e.target).tab('show');
  },

  _onSearchGdocs: function(e) {
    e.preventDefault();
    var self = this;
    
    var picker = new google.picker.PickerBuilder()
      .disableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .addView(google.picker.ViewId.SPREADSHEETS)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);

    function pickerCallback(data) {
      var url = 'nothing';
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        var doc = data[google.picker.Response.DOCUMENTS][0];
        url = doc[google.picker.Document.URL];
        self.$el.find('input[name="url"]').val(url).trigger("change");
      }
    }

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
                    <button title="Select from Google Drive" class="gdrive-import btn"><i class="gdrive"></i></button> \
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
