var Mongo = require('mongodb').MongoClient
var assert = require('assert')
var config = require('../config.json')
assert(config.mongo)

module.exports = function(callback){
  Mongo.connect(config.mongo, callback)
}