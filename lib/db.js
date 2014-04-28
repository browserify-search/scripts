var Mongo = require('mongodb').MongoClient
var assert = require('assert')
var config = require('../db.json')
assert(config.url)

module.exports = function(callback){
  Mongo.connect(config.url, callback)
}