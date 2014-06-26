#! /usr/bin/env node

var cmdLn = require('cmd-ln')
var zmq = require('zmq')
var push = zmq.socket('push')
var assert = require('assert')
var ip = os.networkInterfaces().eth0[0].address
console.log('binding to', ip)
push.bindSync('tcp://' + ip + ':3000')
var db = require('../lib/db')
var eachLimit = require('../lib/mongo/each_limit')

db(function(err, db){
  if (err) return console.error(err.message)

  var Modules = db.collection('modules2')
  eachLimit(
    Modules.find({}, {name: true}),
    10000,
    function(doc, next){
      var module = doc.name
      push.send(JSON.stringify({command: 'import', module: module}))
      setImmediate(next)
    },
    function(err){
      if (err) console.error(err.message)
      db.close()
    }
  )
})