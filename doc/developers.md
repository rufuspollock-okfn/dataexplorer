# Data Explorer for Developers

This document provides an overview of how Data Explorer works.

# Architecture

This diagram ([source](https://docs.google.com/a/okfn.org/drawings/d/1UXk3wtvj97QlfVAyxntNq_Xp4jPb-vYRGgDxnIkkXHk/edit)) provides an overview of the architecture (crudely, red indicates domain objects, green views):

<img src="https://docs.google.com/drawings/d/1UXk3wtvj97QlfVAyxntNq_Xp4jPb-vYRGgDxnIkkXHk/pub?w=846&amp;h=526">

## Models

The central object is a (Data) Project. It has the following structure:

* Some general info such as name, last_modified etc ("metadata")
* (Data) files / Datasets  - these are loaded and can then be queried etc
* Scripts
* View (definitions)


## Serialization of Projects

We serialize to a "Data Package" structure which in turn is then saved either to localStorage (possibly indexedDB)


## Views and Activities

Key components:

* Project and Data Viewer [DONE]
* Data Editor [TBD]
* Script Editor [DONE]
* Script Applier [DONE - partially]
* Persistence [DONE]
* Import [DONE - partially]
* Export [TBD]

# Proposed User Flows

Create Project (Import Data) --> View --> Transform --> View --> Share

-----

# Ideas

Thoughts and ideas - these do not describe the current system or, necessarily, the future system.

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

Want users to be able to link additional scripts in.

# Appendix

## Chrome Extension

Benefits

* Cross-domain xhr +
* Can auto-handle CSV files +
* Run offline ... +++
* Full access to local storage etc

## Simple things

* Processing demo in Data Explorer with Export to local file (can you prompt and write to a file stream - hack via a data uri I believe)

