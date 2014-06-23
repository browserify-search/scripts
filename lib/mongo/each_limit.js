var async = require('async')

module.exports = function(cursor, limit, process, done){
  var error
  var q = async.queue(function(task, next){
    process(task, function(err){
      if (err){
        error = err
        q.tasks = []
      }
      next()
    })
  }, 10)

  q.drain = function(){
    if (error) done(error)
    else done()
  }

  cursor.each(function(err, doc){
    if (doc == null) return
    q.push(doc)
  })
}