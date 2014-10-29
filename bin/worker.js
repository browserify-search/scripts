#! /usr/bin/env node

var config = require('../config.json')
var processModule = require('../lib/process_module')
var getIP = require('../lib/get_ip')
var zmq = require('zmq')
var socket = zmq.socket('req')
var ip = getIP()
var concurrency = 1

socket.connect('tcp://' + config.zeromq_master + ':8001')

socket.send(JSON.stringify({
  type: 'get_test_summary',
  id: ip
}))

socket.once('message', function(msg){
  msg = JSON.parse('' + msg)
  if (msg.type === 'test_summary'){
    start(msg.value)
  }
})

function start(testSummary){
  for (var i = 0; i < concurrency; i++){
    socket.send(JSON.stringify({
      type: 'new',
      id: ip
    }))
  }

  socket.on('message', function(msg){
    msg = JSON.parse('' + msg)
    if (msg.type === 'module'){
      processModule(msg.module, testSummary, function(err, result){
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


