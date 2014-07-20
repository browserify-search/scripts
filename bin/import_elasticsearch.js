#! /usr/bin/env node

var request = require('superagent')
var db = require('../lib/db')
var async = require('async')
require('colors')

db(function(err, db){

  var Modules = db.collection('modules')

  var q = async.queue(function(module, done){
    if (typeof module.search.readme !== 'string'){
      module.search.readme = ''
    }
    request
      .put('http://localhost:9200/browserify-search/module/' + module._id)
      .send(JSON.stringify({
        browserifiability: module.browserifiability,
        search: module.search,
        downloadsLastMonth: module.downloadsLastMonth
      }))
      .end(function(err, reply){
        if (err) process.stdout.write('.'.red)
        else process.stdout.write('.'.green)
        done()
      })
  }, 200)

  Modules.find({browserifiability: {$gt: 0}}).each(function(err, module){
    if (module === null){
      db.close()
      return
    }
    q.push(module)
  })

})