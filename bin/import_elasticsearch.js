#! /usr/bin/env node

var request = require('superagent')
var db = require('../lib/db')
var async = require('async')
require('colors')
var gaussian = require('gaussian')
var config = require('../config.json')

db(function(err, db){

  var Modules = db.collection('modules')
  var ModuleStats = db.collection('moduleStats')
  var count = 0

  ModuleStats.findOne({_id: 1}, function(err, stats){
    if (err) return console.error(err.message)
    
    var info = stats['downloadsLastMonth.count']
    var dist = gaussian(info.avg, info.variance)
    var allQueued = false

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
        db.close()
      }
    }

    Modules
      .find({browserifiability: {$gt: 0}})
      .each(function(err, module){
        if (module === null){
          allQueued = true
          return
        }
        q.push(module)
      })
  })

})