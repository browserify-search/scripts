#! /usr/bin/env node

var async = require('async')
var path = require('path')
var config = require('../config.json')
var testModule = require('../lib/test_module')
var dir = '/tmp/browserify-search'
var getModuleInfo = require('../lib/npm/get_module_info')
var searchInfo = require('../lib/npm/search_info')
var easyFeatures = require('../lib/npm/easy_features')
var browserifiability = require('../lib/browserifiability')
var debug = require('debug')('worker')
var rimraf = require('rimraf')
var getIP = require('../lib/get_ip')
var zmq = require('zmq')
var extend = require('util')._extend
var socket = zmq.socket('req')
var ip = getIP()
var concurrency = 1

socket.connect('tcp://' + config.zeromq_master + ':8001')

socket.send(JSON.stringify({
  type: 'get_test_summary',
  id: ip
}))

socket.once('message', function(msg){
  msg = JSON.parse('' + msg)
  if (msg.type === 'test_summary'){
    start(msg.value)
  }
})

function start(testSummary){
  for (var i = 0; i < concurrency; i++){
    socket.send(JSON.stringify({
      type: 'new',
      id: ip
    }))
  }

  socket.on('message', function(msg){
    msg = JSON.parse('' + msg)
    if (msg.type === 'module'){
      processModule(msg.module, testSummary, function(err, result){
        result.rev = msg.rev
        socket.send(JSON.stringify({
          type: 'result',
          module: msg.module,
          id: ip,
          value: result
        }))
      })
    }else if (msg.type === 'end'){
      console.log('Done')
      process.exit()
    }
  })
}

function processModule(module, testSummary, done){
  console.log('Processing ' + module)
  var timeMeasurements = {}
  var startAll, start, end
  startAll = start = +new Date
  getModuleInfo(module, function(err, info){
    timeMeasurements.moduleInfo = new Date - start
    if (err){
      timeMeasurements.all = new Date - startAll
      return done(null, {
        _id: module,
        invalid: true,
        timeMeasurements: timeMeasurements
      })
    }

    if (!isValid(info)){
      timeMeasurements.all = new Date - startAll
      return done(null, {
        _id: module,
        invalid: true,
        timeMeasurements: timeMeasurements
      })
    }
    var version = info['dist-tags'].latest
    var search = searchInfo(info)
    var features = easyFeatures(info)
    testModule(module, dir, function(err, results, testTimeMeasurements){
      extend(timeMeasurements, testTimeMeasurements)
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
        testResults: results,
        timeMeasurements: timeMeasurements
      }

      start = +new Date
      browserifiability(results, testSummary, function(err, browserifiability){
        timeMeasurements.browserifiability = new Date - start
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
        start = +new Date
        rimraf(path.join(dir, module), function(){
          timeMeasurements.rimraf = new Date - start
          timeMeasurements.all = new Date - startAll
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
