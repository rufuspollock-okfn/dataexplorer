# Design of the Data Explorer

## Architecture

Key components

* Engine - runs everything else (or is just the transform engine?)
* Viewer
* Data Editor
* Script Editor
* Script Applier
* Import / Export

## What does a dataset look like

    dataset
      .metadata (key, value pairs)
      .fields
      .data

## Operations, transforms etc

Every action related to the data can be made to correspond to an operation. For example:

* Importing data
* Exporting data
* Deleting a row

Operations have:

* names / identifiers
* Arguments
* Context
  * dataset
  * config

In essence they are a function:

    function {name}({args}) ...

### What functions do they have available?

### Why have it like this?

The major benefit is repeatability and automation. Every step in processing a
dataset is recorded and is repeatable.

## Writing scripts


# Appendix

## Chrome Extension

Benefits

* Cross-domain xhr +
* Can auto-handle CSV files +
* Run offline ... +++
* Full access to local storage etc

## Simple things

* Processing demo in Data Explorer with Export to local file (can you prompt and write to a file stream - hack via a data uri I believe)

