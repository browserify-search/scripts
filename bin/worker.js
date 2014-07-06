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
    if (cmd === 'test'){
      testTheModule(module, job.version, done)
    }else{
      done()
    }
  }, 2)

  pull.on('message', function(msg){
    q.push(JSON.parse(msg.toString()))
  })

  function testTheModule(module, version, done){
    testModule(module, dir, function(err, results){
      if (err){
        console.error(module, err.message)
        done()
        return
      }
      push.send(
        JSON.stringify({
          name: module, 
          version: version,
          testResults: results
        })
      )
      done()
    })
  }

})

