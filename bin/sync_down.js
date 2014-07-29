#! /usr/bin/env node

var request = require('superagent')
var async = require('async')
var os = require('os')
var db = require('../lib/db')
var config = require('../config.json')
var url = config.npm_api + '/_changes'
var _ = require('lodash')
var zmq = require('zmq')

var socket = zmq.socket('rep')

var app = {
  pending: [],
  active: {},
  complete: []
}

db(function(err, db){
  if (err) return console.error(err.message)

  function startMonitoring(){
    setInterval(function(){
      process.stdout.write(
        '\r' + 
        'pending ' + app.pending.length + 
        ', active ' + Object.keys(app.active).length + 
        ', complete ' + app.complete.length)
    }, 1000)
  }

  var writeQueue = setupWriteQueue(db)

  var LastSeq = db.collection('last_seq')
  LastSeq.findOne({_id: 1}, function(err, lastSeqDoc){
    var lastSeq = lastSeqDoc.last_seq
    console.log('Previous seq', lastSeq)
    request(url + '?since=' + lastSeq)
      .end(function(err, reply){
        err = err || reply.error
        if (err) return console.error(err.message)
        var changes = JSON.parse(reply.text)

        var lastSeq = changes.last_seq
        console.log('New seq', lastSeq)
        app.pending = _.uniq(changes.results
          .map(function(r){ return r.id })
          .filter(function(m){
            return m.substring(0, 8) !== '_design/'
          }))

        console.log(app.pending.length, 'modules to process.')
        LastSeq.update(
          {_id: 1}, 
          {$set: {last_seq: lastSeq}}, 
          {upsert: true},
          function(err){
            initializeSocket(writeQueue)
            startMonitoring()
          }
        )
      })
  })
})

function setupWriteQueue(db){
  var Modules = db.collection('modules')
  return async.cargo(function(results, done){
    var batch = Modules.initializeUnorderedBulkOp()
    for (var i = 0; i < results.length; i++){
      var result = results[i]
      batch.find({_id: result._id})
        .upsert()
        .updateOne(result)
    }
    var start = +new Date
    batch.execute(function(err){
      var end = +new Date
      for (var i = 0; i < results.length; i++){
        var result = results[i]
      }
      done(err)
    })
  })
}

function initializeSocket(writeQueue){
  socket.bind('tcp://' + config.zeromq_master + ':8001', function(err){
    if (err){
      console.error(err.message)
      process.exit()
    }

    socket.on('message', function(msg){
      msg = JSON.parse('' + msg)
      if (msg.type === 'new'){
        dispatchJob()
      }else if (msg.type === 'result'){
        delete app.active[msg.module]
        app.complete.push(msg)
        writeQueue.push(msg.value)
        dispatchJob()
      }
    })
  })

  function dispatchJob(){
    var module = app.pending.pop()
    if (module){
      app.active[module] = true
      socket.send(JSON.stringify({
        type: 'module',
        module: module
      }))
    }else{
      socket.send(JSON.stringify({
        type: 'end'
      }))
      console.log('All done.')
      process.exit()
    }
  }
}