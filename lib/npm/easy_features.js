var assert = require('assert')
var natural = require('natural')

module.exports = function(info){
  assert(info['dist-tags'])
  var latestVersion = info['dist-tags'].latest
  var latestInfo = info.versions[latestVersion]

  return {
    hasTestling: !!latestInfo.testling,
    hasBrowserKeyword: hasWord('browser', keywords(latestInfo)),
    hasBrowserifyField: !!latestInfo.browserify,
    hasBrowserField: !!latestInfo.browser,
    hasBrowserInDescription: hasWord('browser', latestInfo.description),
    hasBrowserInReadme: hasWord('browser', latestInfo.readme),
    hasPluginInDescription: hasWord('plugin', latestInfo.description),
    hasPluginInReadme: hasWord('plugin', latestInfo.readme),
    hasGruntInName: hasWord('grunt', latestInfo.name),
    hasGruntInDescription: hasWord('grunt', latestInfo.description),
    hasGruntInReadme: hasWord('grunt', latestInfo.readme),
    hasExpressInName: hasWord('express', latestInfo.name),
    hasExpressInDescription: hasWord('express', latestInfo.description),
    hasExpressInReadme: hasWord('express', latestInfo.readme)
  }
}

function keywords(info){
  var keywords = info.keywords
  if (!keywords){
    return keywords
  }else if (Array.isArray(keywords)){
    return keywords.join(', ')
  }else{
    return String(keywords)
  }
}

function hasWord(word, string){
  return tokenize(string).indexOf(word) !== -1
}

function tokenize(str){
  if (!str) return []
  str = str.toLowerCase()
  tokenizer = new natural.WordTokenizer();
  var words = tokenizer.tokenize(str)
  return words.concat(
    words.map(function(word){
      return natural.PorterStemmer.stem(word)
    })
  )
}
