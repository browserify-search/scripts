#! /usr/bin/env node

var db = require('./lib/db')
var browserifiability = require('browserifiability')
db(function(err, db){
  if (err) return console.error(err.message)

  var Modules = db.collection('modules')
  var batch = Modules.initializeUnorderedBulkOp()
  Modules.find({'testResults.browserify.bundle.passed': true}).each(function(err, module){
    if (!module){
      console.log('executing')
      var start = +new Date
      batch.execute(function(err, result){
        var duration = new Date - start
        console.log('execute took ' + duration + ' seconds')
        if (err) console.error(err.message)
        else console.log('It worked!')
        console.log(result)
        db.close()      
      })
    }else{
      batch.find({_id: module._id})
        .update({$set: {
          browserifiability: browserifiability(module)
        }})
    }
  })
})