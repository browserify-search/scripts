#! /usr/bin/env node

var fs = require('fs')
var ldj = require('ldjson-stream')
var cmdLn = require('cmd-ln')
var gaussian = require('gaussian')
var db = require('../lib/db')
var elasticSearchBulkInsertTransform = require('../lib/elasticsearch_bulk_insert_transform')

db(function(err, db){
  if (err) return console.error(err.message)

  var Modules = db.collection('modules')
  var ModuleStats = db.collection('moduleStats')
  
  ModuleStats.findOne({_id: 1}, function(err, stats){
    if (err) return console.error(err.message)

    var info = stats['downloadsLastMonth']
    var dist = gaussian(info.avg, info.variance)

    var input = Modules.find({browserifiability: {$gt: 0}})
      .stream()
    var output = process.stdout
    elasticSearchBulkInsertTransform(dist, input, output)
    input.on('end', function(){
      db.close()
    })
  })

})
  