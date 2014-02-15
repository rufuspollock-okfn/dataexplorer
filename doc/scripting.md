---
layout: default
title: Scripting
---

# Scripting

Data Explorer gives you full access to the power of Javascript to analyse and
transform your data.

## Getting Started

You write your scripts in the Scripting Pane at the top right.

You can use any part of the Javascript language along with the following
libraries:

* [UnderscoreJS][] - for standard utility functions
* [Browser Request][request] - for making ajax requests

[UnderscoreJS]: http://underscorejs.org/
[request]: https://github.com/iriscouch/browser-request

## Examples

* [House Price Tutorials](#rgrp/e3e0b0f18dfe151f9f7e) - demonstrates loading
  additional data from remote url and using it to modify local data,
  specifically, in this case, loading inflation data to then convert nominal
  house prices to real house prices.
* [Geodata Transformation (OS Grid Reference to Lat
  Long)](#rgrp/12882a71c68a405d4543) - demonstrates how to do some powerful geo
  transformation, turning OS Grid References (Northing and Eastings) to OSGB36
  and then standard Lat/Long (WGS84).

