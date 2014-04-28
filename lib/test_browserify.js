var jsdom = require('jsdom')
var path = require('path')
var assert = require('assert')
var is = require('is-type')
var log = require('debug')('browserify')
var spawn = require('child_process').spawn

module.exports = function(module, dir, callback){
  assert(is.string(module))
  assert(is.string(dir))
  assert(is.function(callback))

  browserify(module, dir, function(err, code){
    if (err) return callback(err)
    jsdom.env({
      html: '<html><head></head><body><div></div></body></html>',
      src: [String(code)],
      done: function(errs, window){
        window.close()
        if (errs){
          var err = errs[0]
          log('failed with', err)
          return callback(err)
        }else{
          log('worked!')
          callback()
        }
      }
    })
  })

}

function browserify(module, dir, callback){
  var dirpath = path.join(dir, module, 'node_modules', module)
  
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

  p.on('exit', function(code){
    callback(code ? new Error(data) : null, data)
  })
}