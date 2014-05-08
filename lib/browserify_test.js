var assert = require('assert')
var is = require('is-type')
var log = require('debug')('browserify:test')
var spawn = require('child_process').spawn
var path = require('path')

module.exports = function(code, callback){
  assert(is.string(code))
  assert(is.function(callback))

  var data = ''
  var jsdomTestExec = path.join(
    __dirname,
    '..',
    'bin',
    'jsdom_test'
  )
  var p = spawn(jsdomTestExec)

  p.stdin.end(code)

  p.stdout.on('data', function(chunk){
    data += chunk
  })

  p.stderr.on('data', function(chunk){
    data += chunk
  })

  p.on('close', function(code){
    if (code){
      callback(new Error(data))
    }else{
      callback()
    }
  })

}
