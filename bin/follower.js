#! /usr/bin/env node

var follow = require('follow-registry')
var processModule = require('../lib/process_module')
var db = require('../lib/db')
var cmdLn = require('cmd-ln')
var fs = require('fs')

cmdLn(function(since){
  db(function(err, db){
    if (err) return console.error(err.message)

    var Modules = db.collection('modules')
    
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
        processModule(module, function(err, results){
          if (err) return callback(err)
          Modules.update(
            {_id: module},
            results,
            {upsert: true},
            function(err){
              if (err) return callback(err)
              fs.writeFile('CURRENT_SEQ', String(seq), callback)
            }
          )
        })
      }
    }
  
    follow(options)

  })
})