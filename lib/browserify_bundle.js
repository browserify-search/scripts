var spawn = require('child_process').spawn
var path = require('path')
var log = require('debug')('browserify:bundle')

module.exports = function(module, dir, callback){
  var dirpath = path.join(dir, module, 'node_modules', module)
  
  var p = spawn('node_modules/.bin/browserify', [dirpath])

  var data = ''

  p.stdout.on('data', function(chunk){
    data += chunk
    log(chunk + '')
  })

  p.stderr.on('data', function(chunk){
    data += chunk
    log(chunk + '')
  })

  p.on('exit', function(code){
    callback(code ? new Error(data) : null, data)
  })
}