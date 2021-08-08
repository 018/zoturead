Services.scriptloader.loadSubScript('chrome://zoterouread/content/utils.js')

const SearchUrls = {
  uread: 'http://uread.today/search?t=book&q={query}&b={key}',
  douban: 'https://search.douban.com/book/subject_search?search_text={query}',
  superlib: 'http://book.ucdrs.superlib.net/search?sw={query}&allsw=&bCon=&ecode=utf-8&channel=search&Field=all',
  jd: 'https://search.jd.com/Search?keyword={query}',
  dangdang: 'http://search.dangdang.com/?key={query}',
  baidu: 'https://www.baidu.com/s?wd={query}',
  google: 'https://www.google.com.hk/search?q={query}'
}

let searcher = {
}

searcher.searchAuthor = function (searcher, author) {
  if (searcher === 'zotero') {
    this._advancedSearch('creator', author)
  } else {
    this._launchSearch(searcher, author, 'author')
  }
}

searcher.search = function (searcher, key) {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]

  let val
  let name = key
  switch (key) {
    case 'ISBN':
      name = '系列'
      val = item.getField(key).replace(/-/g, '')
      break
    case 'title':
      name = '标题'
      val = item.getField(key).replace(/——.*$/g, '').replace(/\(.*\)$/g, '')
      break
    case 'series':
      name = '系列'
      val = item.getField(key)
      break
    case 'author':
      name = '作者'
      for (const element of item.getCreators()) {
        if (element.creatorTypeID === Zotero.CreatorTypes.getID('author')) {
          val = element.lastName
          break
        }
      }
      break
  }
  if (!val) {
    Utils.warning(`${item.getField('title')}无${name}信息。`)
    return
  }

  Zotero.debug('uRead@searcher: ' + searcher)
  if (searcher === 'zotero') {
    this._advancedSearch(key, val)
  } else {
    let url = SearchUrls[searcher].replace('{query}', val).replace('{key}', key)
    Zotero.launchURL(url)
  }
}

searcher._advancedSearch = function (field, value) {
  var s = new Zotero.Search()
  s.libraryID = Zotero.Libraries.userLibraryID
  s.addCondition(field, 'contains', value)
  var io = {
    dataIn: {
      search: s
    },
    dataOut: null
  }
  var win = window.openDialog('chrome://zotero/content/advancedSearch.xul', '', 'chrome,dialog=no,centerscreen', io)

  setTimeout(() => {
    win.ZoteroAdvancedSearch.search()
  }, 500)
}

searcher._launchSearch = function (searcher, query, key) {
  let url = SearchUrls[searcher].replace('{query}', query).replace('{key}', key)
  Zotero.launchURL(url)
}

if (typeof window !== 'undefined') {
  // API export for Zotero UI
  // Can't imagine those to not exist tbh
  if (!window.Zotero) window.Zotero = {}
  if (!window.Zotero.uRead) window.Zotero.uRead = {}
  if (!window.Zotero.uRead.Searcher) window.Zotero.uRead.Searcher = {}
  // note sure about any of this
  window.Zotero.uRead.Searcher.search = function (search, key) { searcher.search(search, key) }
  window.Zotero.uRead.Searcher.searchAuthor = function (search, author) { searcher.searchAuthor(search, author) }
} else {
  Zotero.debug('uRead@window is null.')
}

if (typeof module !== 'undefined') module.exports = searcher
