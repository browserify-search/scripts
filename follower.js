#! /usr/bin/env node

var follow = require('follow-registry')
var processModule = require('brsh-process-module')
var db = require('./lib/db')
var cmdLn = require('cmd-ln')
var fs = require('fs')
var lastSeq = require('./lib/last_seq')

cmdLn(function(){
  db(function(err, db){
    if (err) return console.error(err.message)

    var Modules = db.collection('modules')
    
    lastSeq.get(db, function(err, since){
      if (err) {
        console.error(err.message)
        db.close()
        return
      }

      console.log('Last seq:', since)
      var options = {
        since: since || 0,
        inactivity_ms: 3600000,
        registry: 'https://registry.npmjs.org/',
        handler: function(data, callback){
          var module = data.json._id
          var seq = data.seq
          if (!module){
            console.error('module def with no _id', data)
            return callback()
          }
          console.log('Processing', module)
          processModule(module, function(err, results){
            console.log(module, 'results', results)
            if (err) return callback(err)
            Modules.update(
              {_id: module},
              results,
              {upsert: true},
              function(err){
                if (err) return callback(err)
                console.log('Saving last seq:', seq)
                lastSeq.set(db, seq, callback)
              }
            )
          })
        }
      }
    
      follow(options)
    })

  })
})