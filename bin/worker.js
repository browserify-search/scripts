#! /usr/bin/env node

var async = require('async')
var db = require('../lib/db')
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
var socket = zmq.socket('req')
var ip = getIP()

db(function(err, db){
  if (err) return console.error(err.message)

  var TestSummary = db.collection('test_summary')
  TestSummary.find().toArray(function(err, testSummary){
    socket.connect('tcp://' + config.zeromq_master + ':8001')

    socket.send(JSON.stringify({
      type: 'new',
      id: ip
    }))
    socket.on('message', function(msg){
      msg = JSON.parse('' + msg)
      if (msg.type === 'module'){
        console.log('Processing ' + msg.module)
        processModule(msg.module, testSummary, function(err, result){
          socket.send(JSON.stringify({
            type: 'result',
            module: msg.module,
            id: ip,
            value: result
          }))
        })
      }else if (msg.type === 'end'){
        db.close()
        console.log('Done')
        process.exit()
      }
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
