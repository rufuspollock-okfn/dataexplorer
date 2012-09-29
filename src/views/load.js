(function(config, models, views, routers, utils, templates) {

views.Load = Backbone.View.extend({
  id: 'load',

  events: {
    'click .load-dataset': '_loadDataset'
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

  _loadDataset: function(e) {
    e.preventDefault();
    var url = this._locateDataset();
    var ds = this._datasetDetails(url);
    app.instance.dataset(ds.user, ds.repo, ds.branch);
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
    <div class="view load"> \
      <form class="js-load-url form-horizontal"> \
        <fieldset> \
          <legend>Load Data</legend> \
          <div class="control-group"> \
            <label for="source" class="control-label">CSV file</label> \
            <div class="controls"> \
              <input type="text" name="source" class="input span4" placeholder="URL to CSV sheet" value="https://github.com/datasets/transformer-test/blob/master/data/data.csv" /> \
              <p class="help-block"></p> \
            </div> \
          </div> \
        </fieldset> \
        <div class="form-actions"> \
          <button type="submit" class="btn btn-primary load-dataset">Load</button> \
        </div> \
      </form> \
    </div> \
  '
});

}).apply(this, window.args);
