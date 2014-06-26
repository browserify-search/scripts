#! /usr/bin/env node

var request = require('superagent')

var url = 'https://skimdb.npmjs.com/registry/_changes'
var since = 0

request(url)
  .query({since: since})
  .end(function(err, reply){
    err = err || reply.error
    if (err) return console.error(err.message)
    var changes = reply.body
    var last_seq = changes.last_seq
    console.log('last_seq', last_seq)
    var results = changes.results
    
  })