View, visualize and transform data in the browser.

Data Explorer is a browser-based (pure HTML + JS) open-source application for
exploring and transforming data.

It works well with any source of tabular data. Load and save from multiple
sources include google spreadsheets, CSVs and Github. Graph and map data, write
javascript to clean and transform data.

Built on [Recline JS](http://okfnlabs.org/recline/).

## Use it

Visit <http://explorer.okfnlabs.org/>

Want to use it locally? Just do "save as" and save the html (with all
associated files) to your hard disk. Note that for github login to work you
will need to have the app opened at a non file:/// url e.g.
http://localhost/dataexplorer.

## Developers

Install:

    git clone --recursive https://github.com/okfn/dataexplorer

Then just open `index.html` in your browser!

Note: if you just open `index.html` most of the app will function but login
will **not** work. For login to work on your local machine you must deploy the
app at this specific URL:

    http://localhost/src/dataexplorer/

The reason for this is that a (uniqute) "callback" URL to the location of the
DataExplore instance that the OAuth login will send users back to has to be set
in Github when you set up the OAuth "app" in Github (and that URL is the one
listed there).

If you are running or nginx or apache on your local machine setting up an alias
like this to your local src directory should be easy.
Also if you have python installed , you can run SimpleHTTPServer from src 's parent 
directory.

    python -m  SimpleHTTPServer 80


### Github Login

Login is via Github using their OAuth method.

We have a pure HTML / JS app (no standard backend) and with pure HTML/JS you
can't do OAuth Github login directly and need an OAuth proxy in the form of
[gatekeeper][].

[gatekeeper]: https://github.com/prose/gatekeeper

Thus, if you want to deploy your own instance of Data Explorer you'll need to
set up a new instance of gatekeeper and then change the `gatekeeper_url` value
in `src/boot.js`.

### Understanding the Architecture

To learn more about the the code see doc/developers.md

### Deploying

For github login you will need to set up your own gatekeeper instance as per above.

## License and Credits

The first version of this app was built by Michael Aufreiter and Rufus Pollock.
It reused several portions of [Prose][] including github login and portions of
the styling.

[Prose]: https://github.com/prose/prose

Licensed under the MIT license.

All Credits as per Recline. Also all the great vendor libraries including:

* Backbone
* Bootstrap
* Leaflet
* Flot
* [CodeMirror](http://codemirror.net/)

