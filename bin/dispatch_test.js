#! /usr/bin/env node

var async = require('async')
var zmq = require('zmq')
var cmdLn = require('cmd-ln')
var _ = require('lodash')
var push = zmq.socket('push')
var assert = require('assert')
var db = require('../lib/db')
var eachLimit = require('../lib/mongo/each_limit')
var ip = '192.241.206.168'
push.bindSync('tcp://' + ip + ':3000')
var pull = zmq.socket('pull')
pull.bindSync('tcp://' + ip + ':3001')

var numWorkers = 0
pull.on('message', function(msg, data){
  console.log('# of workers connected', ++numWorkers)
})

cmdLn(function(numJobs){

  assert(!isNaN(numJobs))
  numJobs = Number(numJobs)

  db(function(err, db){    
    if (err) return console.error(err.message)
    var Modules = db.collection('modules')

    var cursor = Modules.find(
      {
        'testResults.browserify.test.passed': false,
        'testResults.coreDeps': null
      }, 
      {name: true})
      .limit(numJobs)

    eachLimit(
      cursor, 
      10000, 
      function(doc, next){
        push.send(doc.name)
        setImmediate(next)
      },
      function(err){
        if (err) console.error(err.message)
        db.on('close', function(){
          process.exit()
        })
        db.close()
      })
  })

})