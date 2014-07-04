#! /usr/bin/env node

var zmq = require('zmq')
var async = require('async')
var db = require('../lib/db')
var pull = zmq.socket('pull')
var push = zmq.socket('push')
var ip = '199.116.112.230'
var testModule = require('../lib/test_module')
var dir = '/tmp/browserify-search'
var getModuleInfo = require('../lib/npm/get_module_info')
var searchInfo = require('../lib/npm/search_info')
var easyFeatures = require('../lib/npm/easy_features')
var debug = require('debug')('worker')

pull.connect('tcp://' + ip + ':3000')
push.connect('tcp://' + ip + ':3001')

db(function(err, db){
  if (err) return console.error(err.message)
  var Modules = db.collection('modules2')

  var q = async.queue(function(job, done){
    var cmd = job.command
    var module = job.module
    if (cmd === 'import'){
      importModule(module, done)
    }else if (cmd === 'test'){
      testTheModule(module, done)
    }else{
      done()
    }
  }, 2)

  pull.on('message', function(msg){
    q.push(JSON.parse(msg.toString()))
  });

  function importModule(module, done){
    var start = +new Date
    getModuleInfo(module, function(err, info){
      if (err){
        console.warn(module, err.message)
        return done()
      }
      var end = +new Date
      console.log(module, 'api call took', end - start, 'ms')
      var search = searchInfo(info)
      var features = easyFeatures(info)
      start = +new Date
      Modules.update(
        {name: module},
        {$set: {
          version: info['dist-tags'].latest,
          search: search, 
          features: features}},
        {upsert: true},
        function(err){
          if (err) console.warn(err.message)
          end = +new Date
          console.log(module, 'imported took', (end - start), 'ms')
          done()
        }
      )
    })
  }

  function testTheModule(module, done){
    testModule(module, dir, function(err, results){
      if (err){
        console.error(module, err.message)
        done()
        return
      }
      var start = +new Date
      var onInsertCalled = false
      function onInsert(err){
        if (onInsertCalled) return
        onInsertCalled = true
        var end = +new Date
        if (err) console.error(err.message)
        console.log(module, 'tested, insert in', (end - start), 'ms')
        done()
      }
      Modules.insert(
        {name: module, testResults: results},
        onInsert
      )
    })
  }

})

