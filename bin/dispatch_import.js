#! /usr/bin/env node

var cmdLn = require('cmd-ln')
var zmq = require('zmq')
var push = zmq.socket('push')
var assert = require('assert')
var ip = 'forum.atlantajavascript.com'
push.bindSync('tcp://' + ip + ':3000')

cmdLn(function(moduleName){
  push.send({command: 'import', module: moduleName})
})