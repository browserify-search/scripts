#! /usr/bin/env node

var request = require('superagent')
var async = require('async')
var os = require('os')
var db = require('../lib/db')
var CircularList = require('CBuffer')
var config = require('../config.json')
var url = config.npm_api + '/_changes'
var _ = require('lodash')
var zmq = require('zmq')
var replify = require('replify')

var app = {
  startTime: null,
  endTime: null,
  pending: [],
  active: {},
  complete: [],
  saved: 0,
  rollingCompleteCounts: new CircularList(10)
}

replify('sync_down', app)

db(function(err, db){
  if (err) return console.error(err.message)

  var writeQueue = setupWriteQueue(db)
  getLastSeq(db, function(err, prevLastSeq){
    console.log('Previous last seq', prevLastSeq)
    if (prevLastSeq){
      url += '?since=' + prevLastSeq
    }
    request(url)
      .end(function(err, reply){
        err = err || reply.error
        if (err) return console.error(err.message)
        var changes = JSON.parse(reply.text)
        var lastSeq = changes.last_seq
        console.log('New last seq', lastSeq)
        app.pending = moduleNames(changes)

        console.log(app.pending.length + ' modules to process.')
        initializeSocket(writeQueue)
        startMonitoring()
        saveLastSeq(db, lastSeq)
      })
  })
})

function moduleNames(changes){
  return _.uniq(changes.results
    .map(function(r){ return r.id })
    .filter(function(m){
      return m.substring(0, 8) !== '_design/'
    }))
}

function showActive(active){
  var parts = []
  for (var module in active){
    var worker = active[module]
    parts.push(module + ':' + worker)
  }
  return '[' + parts.join(' ') + ']'
}

function getLastSeq(db, callback){
  var LastSeq = db.collection('last_seq')
  LastSeq.findOne({_id: 1}, function(err, lastSeqDoc){
    if (err) return callback(err)
    var lastSeq = lastSeqDoc && lastSeqDoc.last_seq
    callback(null, lastSeq)
  })
}

function saveLastSeq(db, lastSeq, callback){
  var LastSeq = db.collection('last_seq')
  LastSeq.update(
    {_id: 1}, 
    {$set: {last_seq: lastSeq}}, 
    {upsert: true},
    callback || function(){}
  )
}

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
    batch.execute(function(err){
      app.saved += results.length
      done(err)
    })
  })
}

function initializeSocket(writeQueue){
  var socket = zmq.socket('rep')
  socket.bind('tcp://' + config.zeromq_master + ':8001', function(err){
    if (err){
      console.error(err.message)
      process.exit()
    }

    socket.on('message', function(msg){
      msg = JSON.parse('' + msg)
      if (msg.type === 'new'){
        dispatchJob(msg.id)
      }else if (msg.type === 'result'){
        delete app.active[msg.module]
        app.complete.push(msg)
        writeQueue.push(msg.value)
        dispatchJob(msg.id)
      }
    })
  })

  function dispatchJob(worker){
    if (app.startTime == null){
      app.startTime = new Date().getTime()
    }
    var module = app.pending.pop()
    if (module){
      app.active[module] = worker
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

function startMonitoring(){
  setInterval(function(){
    var completeCount = app.complete.length
    app.rollingCompleteCounts.push(completeCount)
    var rate = ((app.rollingCompleteCounts.last() - app.rollingCompleteCounts.first()) / 10).toFixed(1)
    var totalRate = (completeCount * 1000 / (new Date().getTime() - app.startTime)).toFixed(1)
    console.log(
      'pending ' + app.pending.length + 
      ', active ' + Object.keys(app.active).length + 
      ', complete ' + completeCount +
      ', rt ' + rate +
      ', trt ' + totalRate)
  }, 1000)
}