#! /usr/bin/env node

var request = require('superagent')
var async = require('async')
var os = require('os')
var db = require('../lib/db')
var config = require('../config.json')
var url = config.npm_api + '/_changes'
var _ = require('lodash')
var kue = require('kue')
var jobs = kue.createQueue({redis: config.redis})

var app = {
  pendingModules: {},
  processedModules: {}
}

var port = 8012
kue.app.listen(port)
console.log('Listening on port', port)

db(function(err, db){
  if (err) return console.error(err.message)

  function startMonitoring(){
    setInterval(function(){
      console.log(
        'Processed', Object.keys(app.processedModules).length,
        'Pending', Object.keys(app.pendingModules).length)
    }, 10000)
  }

  var Modules = db.collection('modules')
  var q = async.cargo(function(results, done){
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
            var job = jobs.create('module', {
              title: 'Process module ' + module,
              module: module
            }).save(next)
            job.on('complete', function(results){
              delete app.pendingModules[module]
              app.processedModules[module] = true
              console.log('Done processing', module)
              q.push(results)
            })
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