#! /usr/bin/env node

var request = require('superagent')
var async = require('async')
var zmq = require('zmq')
var os = require('os')
var db = require('../lib/db')
var url = 'http://forum.atlantajavascript.com:5984/npm/_changes'
var push = zmq.socket('push')
var pull = zmq.socket('pull')
var _ = require('lodash')
var ip = os.networkInterfaces().eth0[0].address
var replify = require('replify')
console.log('binding to', ip)
pull.bindSync('tcp://' + ip + ':3001')
push.bindSync('tcp://' + ip + ':3000')

var app = {
  lastModulesProcessed: -1,
  pendingModules: {},
  processedModules: {},
  savedModules: {}
}

replify('sync_down', app)

db(function(err, db){
  if (err) return console.error(err.message)

  function startMonitoring(){
    setInterval(function(){
      var modulesProcessed = Object.keys(app.processedModules).length
      var modulesPending = Object.keys(app.pendingModules).length
      console.log(
        'Modules processed', 
        modulesProcessed,
        'Saved Modules',
        Object.keys(app.savedModules).length,
        'Pending modules', 
        modulesPending)
      if (modulesProcessed - app.lastModulesProcessed < 100){
        // we are almost done, let's kick it up a notch
        if (modulesPending === 0){
          console.log('All modules have been processed')
          process.exit()
        }else{
          retry(Object.keys(app.pendingModules))
        }
      }
      app.lastModulesProcessed = modulesProcessed
    }, 10000)
  }

  function retry(modules){
    console.log('Retrying', modules.length, 'modules')
    for (var i = 0; i < modules.length; i++){
      push.send(modules[i])
    }
  }

  var Modules = db.collection('modules')
  var q = async.cargo(function(results, done){
    var batch = Modules.initializeUnorderedBulkOp()
    for (var i = 0; i < results.length; i++){
      var result = results[i]
      app.savedModules[result._id] = true
      batch.find({_id: result._id}).upsert()
        .updateOne(result)
    }
    var start = +new Date
    batch.execute(function(err){
      var end = +new Date
      for (var i = 0; i < results.length; i++){
        var result = results[i]
        app.savedModules[result._id] = true
      }
      done(err)
    })
  })

  pull.on('message', function(result){
    result = JSON.parse('' + result)
    var module = result._id
    if (Object.hasOwnProperty.call(app.processedModules, module)){
      console.warn(module, 'was processed a second time') 
    }else{
      app.processedModules[result._id] = true
      delete app.pendingModules[result._id]
      q.push(result)
    }
  })

  var LastSeq = db.collection('last_seq')
  LastSeq.findOne({_id: 1}, function(err, lastSeqDoc){
    var lastSeq = lastSeqDoc.last_seq
    console.log('last_seq', lastSeq)
    request(url + '?since=' + lastSeq)
      .end(function(err, reply){
        err = err || reply.error
        if (err) return console.error(err.message)
        var changes = JSON.parse(reply.text)

        var lastSeq = changes.last_seq
        console.log('last seq', lastSeq)
        var results = changes.results
        var moduleNames = _.uniq(results
          .map(function(r){ return r.id })
          .filter(function(m){
            return m.substring(0, 8) !== '_design/'
          }))
        console.log('total modules to process', moduleNames.length)
        
        async.eachLimit(
          moduleNames, 
          100, 
          function(module, next){
            app.pendingModules[module] = true
            push.send(module)
            setImmediate(next)
          },
          function(err){
            if (err) console.error(err.message)
            LastSeq.update(
              {_id: 1}, 
              {$set: {last_seq: lastSeq}}, 
              {upsert: true},
              function(err){
                console.log('All jobs sent.')
                startMonitoring()
              }
            )
          }
        )
      })
  })
})