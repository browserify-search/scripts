#! /usr/bin/env node

var follow = require('follow-registry')
var testModuleAndSave = require('../lib/test_module_and_save')
var db = require('../lib/db')
var cmdLn = require('cmd-ln')
var fs = require('fs')

cmdLn(function(since){
  db(function(err, db){
    if (err) return console.error(err.message)

    var options = {
      since: since || 0,
      inactivity_ms: 3600000,
      registry: 'https://registry.npmjs.org/',
      handler: function(data, callback){
        var module = data.json._id
        var seq = data.seq
        testModuleAndSave(db, module, function(err){
          if (err) console.error(err.message)
          fs.writeFile('CURRENT_SEQ', String(seq), callback)
        })
      }
    }

    follow(options)

  })
})