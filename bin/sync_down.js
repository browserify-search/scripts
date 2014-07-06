#! /usr/bin/env node

var request = require('request')
var async = require('async')
var zmq = require('zmq')
var os = require('os')
var db = require('../lib/db')
var url = 'http://forum.atlantajavascript.com:5984/npm/_changes'
var push = zmq.socket('push')
var pull = zmq.socket('pull')
var ip = os.networkInterfaces().eth0[0].address
console.log('binding to', ip)
pull.bindSync('tcp://' + ip + ':3001')
push.bindSync('tcp://' + ip + ':3000')

var since = 0
var lastTotalModulesProcessed = 0
var totalModulesProcessed = 0
var totalModulesSaved = 0
var pendingModules = {}

db(function(err, db){
  if (err) return console.error(err.message)

  setInterval(function(){
    console.log('Modules processed', totalModulesProcessed,
      'modules saved', totalModulesSaved, 
      'pending modules', Object.keys(pendingModules).length)
    if (totalModulesProcessed - lastTotalModulesProcessed){
      // seems all workers are idle
      if (Object.keys(pendingModules).length === 0){
        console.log('All modules have been processed')
        process.exit()
      }else{
        retry(Object.keys(pendingModules))
      }
    }
    lastTotalModulesProcessed = totalModulesProcessed
  }, 10000)

  function retry(modules){
    for (var i = 0; i < modules.length; i++){
      push.send(JSON.stringify({
        command: 'test',
        module: modules[i]
      }))
    }
  }

  var Modules = db.collection('modules2')
  var q = async.cargo(function(results, done){
    var batch = Modules.initializeUnorderedBulkOp()
    for (var i = 0; i < results.length; i++){
      batch.insert(results[i])
    }
    var start = +new Date
    batch.execute(function(err){
      var end = +new Date
      totalModulesSaved += results.length
      done(err)
    })
  })

  pull.on('message', function(result){
    totalModulesProcessed++
    result = JSON.parse('' + result)
    delete pendingModules[result.name]
    q.push(result)
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
        var moduleNames = results
          .map(function(r){ return r.id })
          .filter(function(m){
            return m.substring(0, 8) !== '_design/'
          })
        console.log('total modules changed', moduleNames.length)
        
        async.eachLimit(
          moduleNames, 
          100, 
          function(module, next){
            
            /*push.send(JSON.stringify({
              command: 'import',
              module: module
            }))*/
            
            pendingModules[module] = true

            push.send(JSON.stringify({
              command: 'test',
              module: module
            }))

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
                
              }
            )
          }
        )
      })
  })
})