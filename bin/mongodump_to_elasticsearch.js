#! /usr/bin/env node

var request = require('superagent')
var async = require('async')
require('colors')
var gaussian = require('gaussian')
var config = require('../config.json')
var fs = require('fs')
var ldj = require('ldjson-stream')
var cmdLn = require('cmd-ln')

cmdLn(function(modulesPath, moduleStatsPath){

  var stats = JSON.parse(fs.readFileSync(moduleStatsPath) + '')
  var info = stats['downloadsLastMonth']
  var dist = gaussian(info.avg, info.variance)
  var allQueued = false
  var count = 0

  var q = async.queue(function(module, done){
    if (typeof module.search.readme !== 'string'){
      module.search.readme = ''
    }

    var cdf = dist.cdf(module.downloadsLastMonth.count)
    module.downloadsLastMonth.cdf = cdf
    request
      .put(config.elastic_search + 
        '/browserify-search/module/' + module._id)
      .send(JSON.stringify({
        browserifiability: module.browserifiability,
        search: module.search,
        downloadsLastMonth: module.downloadsLastMonth
      }))
      .end(function(err, reply){
        if (err){
          console.log(err.message)
          process.exit(1)
        }
        else process.stdout.write('.'.green)
        count++
        done()
      })
  }, 200)

  q.drain = function(){
    if (allQueued){
      console.log('All', count, 'modules imported.')
    }
  }

  fs.createReadStream(modulesPath)
    .pipe(ldj.parse())
    .on('data', function(obj){
      if (obj.invalid) return
      if (obj.testResults && !obj.testResults.browserify.bundle.passed) return
      q.push(obj)
    })
    .on('end', function(){
      allQueued = true
    })

})