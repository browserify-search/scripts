#! /usr/bin/env node

var db = require('../lib/db')

db(function(err, db){
  var Modules = db.collection('modules')
  Modules.find().each(function(err, module){
    if (err) return finish(err)
    if (!module) return finish()

    console.log(JSON.stringify({
      create: {
        _index: 'browserify-search',
        _type: 'module',
        _id: module._id,
        browserifiability: module.browserifiability,
        search: module.search
      }
    }))

    function finish(err){
      if (err) console.error(err.message)
      db.close()
    }
  })
})