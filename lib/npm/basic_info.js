module.exports = basicInfo

var assert = require('assert')
var getGithub = require('./get_github_repo')
var is = require('is-type')

function basicInfo(latestInfo){
  
  return {
    name: latestInfo.name,
    description: latestInfo.description,
    keywords: latestInfo.keywords,
    latest: latestInfo.version,
    user: getUser(latestInfo),
    searchText: getSearchText(latestInfo),
    github: getGithub(latestInfo)
  }
}


function getUser(info){
  if (info._npmUser){
    return info._npmUser.name
  }
  if (info.maintainers){
    return info.maintainers[0] && info.maintainers[0].name
  }
}

function getSearchText(info){
  assert(!info.keywords || is.string(info.keywords) || is.array(info.keywords))
  return info.name + '\n\n' +
    (info.description || '') + '\n' + 
    (info.keywords ?
      (is.string(info.keywords) ?
        info.keywords : 
        info.keywords.join(', ')
      ) : 
      ''
    ) + '\n' + 
    (info.readme || '')
}

function convertDeps(deps){
  var ret = []
  for (var key in deps){
    ret.push([key, deps[key]])
  }
  return ret
}
