#! /usr/bin/env node

var cmdLn = require('cmd-ln')
var zmq = require('zmq')
var push = zmq.socket('push')
var assert = require('assert')
var ip = '199.116.112.230'
push.bindSync('tcp://' + ip + ':3000')

cmdLn(function(moduleName){
  push.send(JSON.stringify({command: 'import', module: moduleName}))
})