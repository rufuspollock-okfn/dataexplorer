This provides an overview of how Data Explorer works.

# Flow

Create Project (Import Data) --> View --> Transform --> View --> Share


# Models

## (Data) Projects

Have the following structure:

* Some general info such as name, last_modified etc ("metadata")
* (Data) files - these are loaded and can then be queried etc
* Scripts

## Serialization of Projects

We serialize to a "Data Package" structure.

