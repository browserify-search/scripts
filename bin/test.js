#! /usr/bin/env node

var processModule = require('../lib/process_module')
var db = require('../lib/db')
var cmdLn = require('cmd-ln')

cmdLn(function(module){

  db(function(err, db){
    if (err) return console.error(err.message)

    var TestSummary = db.collection('test_summary')
    TestSummary.find().toArray(function(err, testSummary){
      if (err) return console.error(err.message)
      processModule(module, testSummary, function(err, results){
        if (err) return console.error(err.message)
        console.log(results)
        db.close()
      })
    })
  })

})

