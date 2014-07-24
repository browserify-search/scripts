#! /usr/bin/env node

var zmq = require('zmq')
var async = require('async')
var db = require('../lib/db')
var path = require('path')
var pull = zmq.socket('pull')
var push = zmq.socket('push')
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
pull.connect('tcp://' + ip + ':3000')
push.connect('tcp://' + ip + ':3001')

db(function(err, db){
  if (err) return console.error(err.message)

  var TestSummary = db.collection('test_summary')
  TestSummary.find().toArray(function(err, testSummary){
    var q = async.queue(function(module, done){
      processModule(module, testSummary, done)
    }, 2)
    
    pull.on('message', function(msg){
      q.push(msg.toString())
    })
  })  

})

function processModule(module, testSummary, done){
  getModuleInfo(module, function(err, info){
    if (err){
      push.send(
        JSON.stringify({
          _id: module,
          invalid: true
        })
      )
      return done()
    }

    if (!isValid(info)){
      push.send(
        JSON.stringify({
          _id: module,
          invalid: true
        })
      )
      return done()
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

        push.send(JSON.stringify(results))
        finish()
      })

      function finish(){
        rimraf(path.join(dir, module), function(){
          done()
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
