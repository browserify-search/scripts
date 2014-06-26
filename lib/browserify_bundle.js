var spawn = require('child_process').spawn
var path = require('path')
var log = require('debug')('browserify:bundle')

module.exports = function(module, dir, callback){
  var dirpath = path.join(dir, module, 'node_modules', module.split('@')[0])
  var p = spawn('node_modules/.bin/browserify', [dirpath])

  var data = ''

  p.stdout.on('data', function(chunk){
    data += chunk
    //log(chunk + '')
  })

  p.stderr.on('data', function(chunk){
    data += chunk
    //log(chunk + '')
  })

  p.on('close', function(code){
    callback(code ? new Error(data) : null, data)
  })
}