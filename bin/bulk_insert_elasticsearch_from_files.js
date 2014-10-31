#! /usr/bin/env node

var fs = require('fs')
var ldj = require('ldjson-stream')
var cmdLn = require('cmd-ln')
var gaussian = require('gaussian')
var elasticSearchBulkInsertTransform = require('../lib/elasticsearch_bulk_insert_transform')

cmdLn(function(modulesPath, moduleStatsPath){

  var stats = JSON.parse(fs.readFileSync(moduleStatsPath) + '')
  var info = stats['downloadsLastMonth']
  var dist = gaussian(info.avg, info.variance)

  var input = fs.createReadStream(modulesPath)
    .pipe(ldj.parse())
  var output = process.stdout
  elasticSearchBulkInsertTransform(dist, input, output)

})
