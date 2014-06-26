#! /usr/bin/env node

var zmq = require('zmq')
var async = require('async')
var db = require('../lib/db')
var pull = zmq.socket('pull')
var push = zmq.socket('push')
var ip = '199.116.112.230'
var testModule = require('../lib/test_module')
var dir = '/tmp/browserify-search'

pull.connect('tcp://' + ip + ':3000')
push.connect('tcp://' + ip + ':3001')

db(function(err, db){
  if (err) return console.error(err.message)
  var Modules = db.collection('modules')

  var q = async.queue(function(module, done){
    console.log('got job', module)
    /*
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
    */
    setTimeout(done, 1000)
  }, 4)

  pull.on('message', function(msg){
    q.push(JSON.parse(msg.toString()))
    //console.log('work: %s', msg.toString());
  });

})