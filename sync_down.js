#! /usr/bin/env node

var request = require('superagent')
var async = require('async')
var os = require('os')
var db = require('./lib/db')
var CircularList = require('CBuffer')
var config = require('./config.json')
var url = config.npm_api + '/_changes'
var _ = require('lodash')
var zmq = require('zmq')
var replify = require('replify')
var declaredLastSeq = process.argv[2]

var app = {
  startTime: null,
  endTime: null,
  pending: [],
  active: {},
  complete: [],
  saved: 0,
  rollingCompleteCounts: new CircularList(10),
  rollingModuleInfoTimes: new CircularList(10),
  rollingInstallTimes: new CircularList(10),
  rollingBundleTimes: new CircularList(10),
  rollingBrowserifiabilityTimes: new CircularList(10),
  rollingRimrafTimes: new CircularList(10),
  rollingProcessingTimes: new CircularList(10)
}

replify('sync_down', app)

db(function(err, db){
  if (err) return console.error(err.message)

  var writeQueue = setupWriteQueue(db)
  getLastSeq(db, function(err, prevLastSeq){
    if (err) return console.error(err.message)

    var since = declaredLastSeq || prevLastSeq
    if (since){
      console.log('Getting changes since ' + since)
      url += '?since=' + since
    }
    request(url)
      .end(function(err, reply){
        err = err || reply.error
        if (err) return console.error(err.message)
        var changes = JSON.parse(reply.text)
        var lastSeq = changes.last_seq
        console.log('New last seq', lastSeq)
        app.pending = jobsFromChanges(changes)

        console.log(app.pending.length + ' modules to process.')
        initializeSocket(writeQueue, db)
        startMonitoring()
        saveLastSeq(db, lastSeq)
        
      })
  })
})

function jobsFromChanges(changes){
  return changes.results
    .filter(function(result){
      return result.id.substring(0, 8) !== '_design/'
    })
    .map(function(result){
      return {
        module: result.id,
        rev: result.changes[0].rev
      }
    })
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

function initializeSocket(writeQueue, db){
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
        updateTimeMeasurementAverages(msg.value.timeMeasurements)

        dispatchJob(msg.id)
      }
    })
  })

  function dispatchJob(worker){
    if (app.startTime == null){
      app.startTime = new Date().getTime()
    }

    tryDispatchNext()

    function tryDispatchNext(){
      var job = app.pending.pop()
      if (!job){
        socket.send(JSON.stringify({
          type: 'end'
        }))
        console.log('All done.')
        process.exit()
      }else{
        socket.send(JSON.stringify({
          type: 'module',
          module: job.module,
          rev: job.rev
        }))
        app.active[job.module] = worker
      }
    }
  }
}

function updateTimeMeasurementAverages(timeMeasurements){
  app.rollingModuleInfoTimes.push(timeMeasurements.moduleInfo || 0)
  app.rollingInstallTimes.push(timeMeasurements.install || 0)
  app.rollingBundleTimes.push(timeMeasurements.bundle || 0)
  app.rollingBrowserifiabilityTimes.push(timeMeasurements.browserifiability || 0)
  app.rollingRimrafTimes.push(timeMeasurements.rimraf || 0)
  app.rollingProcessingTimes.push(timeMeasurements.all)
}

function startMonitoring(){
  setInterval(function(){
    var completeCount = app.complete.length
    app.rollingCompleteCounts.push(completeCount)
    var rate = ((app.rollingCompleteCounts.last() - 
      app.rollingCompleteCounts.first()) / 10).toFixed(1)
    var totalRate = (completeCount * 1000 / 
      (new Date().getTime() - app.startTime)).toFixed(1)
    console.log(
      'pending ' + app.pending.length + 
      ', active ' + Object.keys(app.active).length + 
      ', complete ' + completeCount +
      ', rt ' + rate +
      ', trt ' + totalRate)

    console.log(
      '  module info ' + average(app.rollingModuleInfoTimes) +
      ', install ' + average(app.rollingInstallTimes) +
      ', bundle ' + average(app.rollingBundleTimes) +
      ', browserifiability ' + average(app.rollingBrowserifiabilityTimes) + 
      ', rimraf ' + average(app.rollingRimrafTimes) +
      ', total ' + average(app.rollingProcessingTimes))

  }, 1000)
}

function average(arr){
  var sum = 0
  var count = 0
  arr.forEach(function(n){
    sum += n
    count++
  })
  return sum / count
}