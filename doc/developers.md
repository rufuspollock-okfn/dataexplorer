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

