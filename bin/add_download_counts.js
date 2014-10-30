#! /usr/bin/env node

var db = require('../lib/db')
var request = require('superagent')
var async = require('async')
var cmdLn = require('cmd-ln')

cmdLn(function(mode){
  db(function(err, db){
    var Modules = db.collection('modules')
    var count = 0
    var q = async.queue(function(module, done){
      request('https://api.npmjs.org/downloads/point/last-month/' + module)
        .end(function(err, reply){
          err = err || reply.error
          if (err) return done(err)
          var info = reply.body
          Modules.update({_id: module},
            {$set: {downloadsLastMonth: 
              {start: info.start, count: info.downloads}}
            }, function(err){
              if (err) return done(err)
              //console.log('Saved download counts for', module)
              process.stdout.write('.')
              count++
              done()
            })
        })
    }, 100)

    q.drain = function() {
      console.log('All', count, 'items have been processed')
      db.close()
    }

    var query
    if (mode === 'all'){
      query = {}
    }else if (mode === 'missing'){
      query = {downloadsLastMonth: {$exists: true}}
    }else{
      throw new Error('Unknown mode: ' + mode)
    }
    Modules.find(query, {name: true}).each(function(err, module){
      if (module == null) return
      q.push(module._id)
    })


  })
})