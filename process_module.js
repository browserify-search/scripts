#! /usr/bin/env node

var processModule = require('process-module')
var cmdLn = require('cmd-ln')
var db = require('./lib/db')

cmdLn(function(module){

  db(function(err, db){
    var Modules = db.collection('modules')

    processModule(module, function(err, results){
      if (err) return callback(err)
      Modules.update(
        {_id: module},
        results,
        {upsert: true},
        function(err){
          if (err) return callback(err)
          console.log('Saved', results)
          db.close()
        }
      )
    })
  })

})