var assert = require('assert')
var is = require('is-type')

module.exports = function(coll, key, doc, callback){
  assert(is.object(coll))
  assert(is.string(key))
  assert(is.object(doc))
  assert(is.function(callback))
  var criteria = {}
  criteria[key] = doc[key]
  doc.updated = new Date
  coll.update(criteria, doc, {upsert: true}, callback)
}