var request = require('superagent')

module.exports = function(module, callback){
  request('https://api.npmjs.org/downloads/point/last-month/' + module)
    .end(function(err, reply){
      err = err || reply.error
      if (err) return callback(err)
      var info = reply.body
      callback(null, info)
    })
}