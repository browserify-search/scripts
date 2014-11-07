#! /usr/bin/env node

var processModule = require('brsh-process-module')
var db = require('./lib/db')
var cmdLn = require('cmd-ln')

cmdLn(function(module){

  db(function(err, db){
    if (err) return console.error(err.message)

    processModule(module, function(err, results){
      if (err) return console.error(err.message)
      console.log(JSON.stringify(results, null, '  '))
      db.close()
    })
  })

})

