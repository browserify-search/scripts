var assert = require('assert')

module.exports = function(info){
  assert(info['dist-tags'])
  var latestVersion = info['dist-tags'].latest
  var latestInfo = info.versions[latestVersion]

  return {
    name: latestInfo.name,
    description: latestInfo.description,
    keywords: keywords(latestInfo),
    readme: info.readme
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