
module.exports = function(coll, criteria, callback){
  coll.find(criteria).toArray(function(err, matches){
    if (err) return callback(err)
    if (matches.length > 1){
      return callback(new Error('Found more than one match for ' + JSON.stringify(criteria)))
    }
    if (matches.length === 1){
      return callback(null, matches[0])
    }
    callback(null, null)
  })
}