if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Searcher) Zotero.ZotURead.Searcher = {};

const SearchUrls = {
  uread: 'http://uread.today/search?t=book&q={query}&b={key}',
  douban: 'https://search.douban.com/book/subject_search?search_text={query}',
  superlib: 'http://book.ucdrs.superlib.net/search?sw={query}&allsw=&bCon=&ecode=utf-8&channel=search&Field=all',
  jd: 'https://search.jd.com/Search?keyword={query}',
  dangdang: 'http://search.dangdang.com/?key={query}',
  baidu: 'https://www.baidu.com/s?wd={query}',
  google: 'https://www.google.com.hk/search?q={query}'
}

Zotero.ZotURead.Searcher.searchAuthor = function (searcher, author) {
  if (searcher === 'zotero') {
    this._advancedSearch('creator', author)
  } else {
    this._launchSearch(searcher, author, 'author')
  }
}

Zotero.ZotURead.Searcher.search = function (searcher, key) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }

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
    case 'note':
      name = '笔记'
      val = item.getField('title')
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
    Zotero.ZotURead.Messages.warning(`${item.getField('title')}无${name}信息。`)
    return
  }

  if (searcher === 'zotero') {
    this._advancedSearch(key, val)
  } else {
    let url = SearchUrls[searcher].replace('{query}', val).replace('{key}', key)
    Zotero.launchURL(url)
  }
}

Zotero.ZotURead.Searcher.searchEBook = function (site) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }

  let item = zitems[0]
  let isbn = item.getField('ISBN').replace(/-/g, '')
  let title = item.getField('title').replace(/——.*$/g, '').replace(/\(.*\)$/g, '')

  switch (site) {
    case 'zlibrary':
      Zotero.launchURL('https://1lib.us/s/' + isbn)
      break
    case 'librarygenesis':
      Zotero.launchURL('https://libgen.rs/search.php?req=' + isbn + '&open=0&res=25&view=simple&phrase=1&column=identifier')
      break
    case 'xueshu86':
      Zotero.launchURL('https://www.readersteam.com/vip/?aff=readersteam&q=' + isbn)
      break
    case 'lorefree':
      Zotero.launchURL('https://ebook2.lorefree.com/site/index?s=' + title)
      break
    case 'yabook':
      Zotero.launchURL('https://yabook.org/?q=' + title)
      break
    default:
      break
  }
}

Zotero.ZotURead.Searcher._advancedSearch = function (field, value) {
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

Zotero.ZotURead.Searcher._launchSearch = function (searcher, query, key) {
  let url = SearchUrls[searcher].replace('{query}', query).replace('{key}', key)
  Zotero.launchURL(url)
}
