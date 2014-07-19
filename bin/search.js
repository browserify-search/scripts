#! /usr/bin/env node

var request = require('superagent')
var cmdLn = require('cmd-ln')
require('colors')

cmdLn(function(query){
  request
    .get('http://forum.atlantajavascript.com:9200/browserify-search/module/_search')
    .send(JSON.stringify({
      size: 100,
      query: {
        function_score: {
          score_mode: 'first',
          boost_mode: 'multiply',
          query: {
            multi_match: {
              query: query,
              fields: [
                'search.name',
                'search.keywords',
                'search.description',
                'search.readme'
              ]
            }
          },
          functions: [
            {
              script_score: {
                script: "doc['browserifiability'].value",
                lang: 'mvel'
              }
            }
          ]
        }
      }
    }))
    .end(function(err, reply){
      if (err) return console.error(err.message)
      var results = reply.body
      if (results.error){
        console.log(results.error)
        return
      }
      /*
      var hits = results.hits.hits.map(function(m){return m._source})
      console.log(hits.length, 'hits')
      hits.forEach(function(module){
        console.log(
          module.search.name)
        console.log('  ',
          module.browserifiability, 
          module.search.description)
      })*/
      results.hits.hits.forEach(function(hit){
        var module = hit._source
        var score = hit._score
        console.log(
          module.search.name)
        console.log('  ',
          score, module.browserifiability, 
          module.search.description)
      })
      //console.log(results.hits.hits)
    })
})