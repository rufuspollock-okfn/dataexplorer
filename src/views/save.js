(function(my) {
"use strict";

my.Save = Backbone.View.extend({
  id: 'save',

  events: {
    'click .save-dataset': '_saveDataset'
  },

  _locateDataset: function() {
    return $("div.control-group input[name=source]").first().val();
  },

  _datasetDetails: function(url) {
    return { 
      user: url.split("/")[3],
      repo: url.split("/")[4],
      branch: url.split("/")[6]
    };
  },

  _saveDataset: function(e) {
    e.preventDefault();
    var url = this._locateDataset();
    var ds = this._datasetDetails(url);
    this.saveDataset(ds);
    return false;
  },

  _serializeCSV: function (dataset) {
  	var records = [];
  	records.push(dataset.fields.pluck('id'));
  	_.each(dataset._store.data, function(record, index) {
  	  // TODO: WTF?!
  	  if (index > 20) return;
  	  // TODO: WTF?! END
  	  var tmp = [];
  	  dataset.fields.each(function(field) {
  		tmp.push(record[field.id]);
  	  });
  	  records.push(tmp);
  	});
  	return recline.Backend.CSV.serializeCSV(records);
  },

  saveDataset: function(location) {
  	var rawCSV = this._serializeCSV(this.project.dataset);
    DataExplorer.Model.saveDataset(location.user, location.repo, location.branch, rawCSV, "updated file", function(err) {
	  alert((function() { 
		if (!err) return "Saved."
		switch (err.error) {
		  case 404: return "Error saving: not logged in or URL not found";
          default: return "Error saving, HTTP code: " + err;
		}})());
	});		   
    return false;
  },

  initialize: function(options) {
    this.el = $(this.el);
  },

  render: function() {
    var rendered = _.template(this.template, {});
    $(this.el).html(rendered);
    return this;
  },
  
  template: ' \
    <div class="view save"> \
      <form class="js-save-url form-horizontal"> \
        <fieldset> \
          <legend>Save</legend> \
          <div class="control-group"> \
            <label for="source" class="control-label">CSV file</label> \
            <div class="controls"> \
              <input type="text" name="source" class="input span4" placeholder="URL to CSV sheet" value="https://github.com/datasets/transformer-test/blob/master/data/data.csv" /> \
              <p class="help-block"></p> \
            </div> \
          </div> \
        </fieldset> \
        <div class="form-actions"> \
          <button type="submit" class="btn btn-primary save-dataset">Save</button> \
        </div> \
      </form> \
    </div> \
  '
});

}(this.DataExplorer.View));
