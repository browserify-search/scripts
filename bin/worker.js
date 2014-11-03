#! /usr/bin/env node

var config = require('../config.json')
var processModule = require('process-module')
var getIP = require('get-my-ip')
var zmq = require('zmq')
var socket = zmq.socket('req')
var ip = getIP()
var concurrency = 2

socket.connect('tcp://' + config.zeromq_master + ':8001')

start()

function start(){
  for (var i = 0; i < concurrency; i++){
    socket.send(JSON.stringify({
      type: 'new',
      id: ip
    }))
  }

  socket.on('message', function(msg){
    msg = JSON.parse('' + msg)
    if (msg.type === 'module'){
      processModule(msg.module, function(err, result){
        result.rev = msg.rev
        socket.send(JSON.stringify({
          type: 'result',
          module: msg.module,
          id: ip,
          value: result
        }))
      })
    }else if (msg.type === 'end'){
      console.log('Done')
      process.exit()
    }
  })
}


