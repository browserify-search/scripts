#! /usr/bin/env node

var async = require('async')
var db = require('../lib/db')
var path = require('path')
var config = require('../config.json')
var ip = config.zeromq_master
var testModule = require('../lib/test_module')
var dir = '/tmp/browserify-search'
var getModuleInfo = require('../lib/npm/get_module_info')
var searchInfo = require('../lib/npm/search_info')
var easyFeatures = require('../lib/npm/easy_features')
var browserifiability = require('../lib/browserifiability')
var debug = require('debug')('worker')
var rimraf = require('rimraf')
var kue = require('kue')
var jobs = kue.createQueue({redis: config.redis})
var getIP = require('../lib/get_ip')
var ip = getIP()

db(function(err, db){
  if (err) return console.error(err.message)

  var TestSummary = db.collection('test_summary')
  TestSummary.find().toArray(function(err, testSummary){

    jobs.process('module', 2, function(job, done){
      var module = job.data.module
      processModule(module, testSummary, done)
    })
  })  

})

function processModule(module, testSummary, done){
  getModuleInfo(module, function(err, info){
    if (err){
      return done(null, {
        _id: module,
        invalid: true
      })
    }

    if (!isValid(info)){
      return done(null, {
        _id: module,
        invalid: true
      })
    }
    var version = info['dist-tags'].latest
    var search = searchInfo(info)
    var features = easyFeatures(info)
    testModule(module, dir, function(err, results){
      if (err){
        console.error(module, err.message)
        finish()
        return
      }

      var results = {
        _id: module, 
        version: version,
        search: search,
        features: features,
        testResults: results
      }

      browserifiability(results, testSummary, function(err, browserifiability){
        if (err){
          results.browserifiability = {
            error: err.message
          }
        }else{
          results.browserifiability = browserifiability
        }

        finish()
      })

      function finish(){
        rimraf(path.join(dir, module), function(){
          done(null, results)
        })
      }
    })
  })
}

function isValid(pkg){
  var tags = pkg['dist-tags']
  if (!tags) return false
  var latest = tags.latest
  if (!latest) return false
  if (!pkg.versions[latest]) return false
  return true
}
