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
var basicInfo = require('../lib/npm/basic_info')
pull.connect('tcp://' + ip + ':3000')
push.connect('tcp://' + ip + ':3001')

db(function(err, db){
  if (err) return console.error(err.message)
  var Modules = db.collection('modules')

  var q = async.queue(function(job, done){
    console.log('got job', job)
    var cmd = job.command
    var module = job.module
    if (cmd === 'import'){
      getModuleInfo(module, function(err, info){
        console.log(module, info)
        done()
      })
    }else if (cmd === 'test'){
      testModule(module, dir, function(err, results){
        if (err){
          console.error(err.message)
          done()
          return
        }
        console.log('got results for', module, results)
        Modules.update(
          {name: module},
          {$set: {testResults: results}},
          function(err){
            if (err) console.error(err.message)
            done()
          })
      })
    }
  }, 4)

  pull.on('message', function(msg){
    q.push(JSON.parse(msg.toString()))
    //console.log('work: %s', msg.toString());
  });

})