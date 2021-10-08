Services.scriptloader.loadSubScript('chrome://zoterouread/content/utils.js')

let site = {
}

site.refresh = async function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Utils.getString('uread.title.refresh'))
  pw.addDescription(Utils.getString('uread.choose', zitems.length))
  pw.show()
  pw.addDescription(Utils.getString('uread.click_on_close'))

  for (const item of zitems) {
    let url = item.getField('url')
    if (!this.checkUrl(url)) {
      pw.addLines(item.getField('title') + '，非今日优读抓取，已跳过。', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
      continue
    }
    let doi = Utils.getParam(url, 'doi')
    Zotero.HTTP.doGet('http://api.uread.today/master/anon/book/get?doi=' + doi, function (request) {
      if (request.status === 200) {
        Zotero.debug('uRead@ret: ' + request.responseText)
        let json = JSON.parse(request.responseText)
        if (json && json.resultcode === 1) {
          let book = json.data
          item.setField('title', book.title + (book.subtitle ? ('——' + book.subtitle) : '') + (book.edition && book.edition !== '1' && book.edition !== '一' ? `(第${book.edition}版)` : ''))
          item.setField('publisher', book.publishers.join(','))
          item.setField('date', book.date)
          item.setField('ISBN', book.isbn)
          item.setField('numPages', book.pages)
          item.setField('series', book.series)
          item.setField('archiveLocation', book.clc)
          item.setField('archive', book.subject)
          item.setField('abstractNote', book.abstract_note)
          item.setField('edition', book.edition)

          let creators = []
          for (let author of book.authors) {
            if (author.type === 1) {
              creators.push({
                lastName: (author.prefix ? ('[' + author.prefix + ']') : '') + author.name,
                creatorType: 'author',
                fieldMode: 1
              })
            } else if (author.type === 2) {
              creators.push({
                lastName: author.name,
                creatorType: 'translator',
                fieldMode: 1
              })
            }
          }
          item.setCreators(creators)

          let tags = []
          for (let tag of book.tags) {
            tags.push(tag)
          }
          item.setTags(tags)

          let extra = ''
          for (let score_ref of book.score_refs) {
            if (score_ref.domin === 'douban.com') {
              extra = score_ref.value + '/' + score_ref.comments;
            }
          }
          extra += (extra ? '|' : '') + book.score
          item.setField('extra', extra)
          item.saveTx()

          let cover_url = book.cover_url
          Zotero.HTTP.doGet(`http://api.uread.today/master/anon/book/list_catalogues?doi=${doi}`, function (request) {
            if (request.status === 200) {
              Zotero.debug('uRead@ret: ' + request.responseText)
              let json = JSON.parse(request.responseText)
              if (json.resultcode !== 1) {
                return
              }
              let notes = '<p><strong>目录</strong></p>\n<p><img src="' + cover_url + '" alt="" style="max-width: 135px; max-height: 200px;" /></p><p>'
              let maxtier = 1
              for (let content of json.data) {
                maxtier = Math.max(content.tier, maxtier)
              }
              for (let content of json.data) {
                notes += '　'.repeat(content.tier - 1) + (maxtier > 1 && content.tier === 1 ? '<b>' : '') + content.content + (maxtier > 1 && content.tier === 1 ? '</b>' : '') + '<br >'
              }
              notes += '</p>'

              let note
              for (let index = 0; index < item.getNotes().length; index++) {
                const noteid = item.getNotes()[index]
                note = Zotero.Items.get(noteid)
                if (note.getNoteTitle() === '目录') {
                  break
                }
              }

              if (note) {
                note.setNote(notes)
                note.saveTx()
                Zotero.debug('uRead@setNote' + note.getNote())
              } else {
                note = new Zotero.Item('note')
                note.libraryID = ZoteroPane.getSelectedLibraryID()
                note.parentKey = item.getField('key')
                note.setNote(notes)
                note.saveTx()
                Zotero.debug('uRead@addNote' + note.getNote())
              }
              pw.addLines(item.getField('title'), `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
            } else if (request.status === 0) {
              pw.addLines(`抓取 ${item.getField('title')} 目录失败 - 网络错误。`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
            } else {
              pw.addLines(`抓取 ${item.getField('title')}，${request.status} 目录失败 - ${request.statusText}`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
            }
          })
        } else {
          pw.addLines(item.getField('title') + '，' + json.message, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        }
      } else if (request.status === 0) {
        pw.addLines(`${item.getField('title')} - 网络错误。`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      } else {
        pw.addLines(`${item.getField('title')}，${request.status} - ${request.statusText}`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      }
    }.bind(this))
  }
}

site.embody = function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]

  let isbn = item.getField('ISBN').replace(/-/g, '')
  Zotero.launchURL('http://uread.today/embody?isbn=' + isbn)
}

site.quickview = async function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }

  Zotero.openInViewer(zitems[0].getField('url'))
}

site.openaschrome = async function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  for (const item of zitems) {
    let url = item.getField('url')
    Zotero.Utilities.Internal.exec('/usr/bin/open', ['-a', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', url])
  }
}

site.clcinfo = function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]

  let clc = item.getField('archiveLocation')
  if (clc && /^[A-Z][A-B|0-9|/|-|\\.]+$/g.exec(clc)) {
    Zotero.launchURL('http://uread.today/clc?c=' + clc)
  } else {
    Utils.warning(`${item.getField('title')}无中图分类信息，可先通过「工具」-「修复中图分类号」获取中图分类号。`)
  }
}

site.subjectinfo = function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]

  let subject = item.getField('archive')
  if (subject && /^\d{3,7}$/g.exec(subject)) {
    Zotero.launchURL('http://uread.today/subject?c=' + subject)
  } else {
    Utils.warning(`${item.getField('title')}无学科信息，可先通过「工具」-「修复学科号」获取学科号。`)
  }
}

site.authorsinfo = function (author) {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }

  let item = zitems[0]
  let url = item.getField('url')
  if (!this.checkUrl(url)) {
    // 搜索
    Zotero.launchURL('http://uread.today/authors?q=' + author)
    return
  }
  let doi = Utils.getParam(url, 'doi')
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Utils.getString('uread.title'))
  pw.addLines('处理中...', `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`)
  pw.show()
  Zotero.HTTP.doGet('http://api.uread.today/master/anon/book/get?doi=' + doi, function(request) {
    pw.close()
    if (request.status === 200) {
      Zotero.debug('uRead@ret: ' + request.responseText)
      let json = JSON.parse(request.responseText)
      if (json && json.resultcode === 1) {
        let book = json.data
        let authorCode = []
        for (let a of book.authors) {
          if (a.name === author) {
            authorCode = a.code
            Zotero.launchURL('http://uread.today/author?c=' + authorCode)
            return
          }
        }
        Utils.warning(`《${item.getField('title')}》无${author}信息。`)
      } else {
        Utils.warning(`《${item.getField('title')}》获取作者信息异常，${json.message}`)
      }
    } else if (request.status === 0) {
      Utils.warning(`${request.status} - 网络错误。`)
    } else {
      Utils.warning(`${request.status} - ${request.statusText}`)
    }
  }.bind(this))
}

site.publisherinfo = function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]

  let publisher = item.getField('publisher')
  if (publisher) {
    let url = item.getField('url')
    if (!this.checkUrl(url)) {
      Zotero.launchURL('http://uread.today/publishers?q=' + publisher)
    } else {
      Zotero.launchURL('http://uread.today/publisher?n=' + publisher)
    }
  } else {
    Utils.warning(`《${item.getField('title')}》无出版社信息。`)
  }
}

site.translate = function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]

  let isbn = item.getField('ISBN').replace(/-/g, '')
  let url = 'http://api.uread.today/master/anon/book/get?isbn=' + isbn
  Zotero.HTTP.doGet(url, function (request) {
    if (request.status === 200) {
      Zotero.debug('uRead@ret: ' + request.responseText)
      let json = JSON.parse(request.responseText)
      if (json && json.resultcode === 1) {
        let doi = json.data
        let oldUrl = item.getField('url')
        let newUrl = 'http://uread.today/book?doi=' + doi + '&src=' + oldUrl
        item.setField('url', newUrl)
        item.saveTx()
        Zotero.debug(oldUrl + ' >>> ' + newUrl)
        Utils.success('转化成功。')
      } else {
        Utils.warning(`未收录${isbn}，请先收录。`)
        Zotero.launchURL('http://uread.today/embody?isbn=' + isbn)
      }
    } else if (request.status === 0) {
      Utils.warning(`${request.status} - 网络错误。`)
    } else {
      Utils.warning(`${request.status} - ${request.statusText}`)
    }
  }.bind(this))
}

site.restoretranslate = function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]
  let oldUrl = item.getField('url')
  let newUrl = Utils.getParam(oldUrl, 'src')
  if (newUrl) {
    item.setField('url', newUrl)
    item.saveTx()
    Zotero.debug(oldUrl + ' >>> ' + newUrl)
    Utils.success('还原转化成功。')
  } else {
    Utils.warning('无法还原转化。')
  }
}

site.addCatalogueCompare = function () {
  var zitems = Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Utils.warning(Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Utils.getString('uread.title'))
  pw.show()
  let itemProgress = new pw.ItemProgress(
    `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
    `处理中 ...`
  )
  itemProgress.setProgress(50)
  let dois = []
  let count = 0
  for (const zitem of zitems) {
    let url = zitem.getField('url')
    let doi = Utils.getParam(url, 'doi')
    if (doi) {
      dois.push(doi)
    } else {
      count++
      if (itemProgress) {
        itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
        itemProgress.setText(`${zitem.getField('title')}不是今日优读抓取的书籍，已跳过。`)
        itemProgress.setProgress(100)
        itemProgress = null
      } else {
        itemProgress = new pw.ItemProgress(
          `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`,
          `${zitem.getField('title')}不是今日优读抓取的书籍，已跳过。`
        )
        itemProgress.setProgress(100)
        itemProgress = null
      }
    }
  }
  Zotero.debug('uRead@dois: ' + dois)

  if (count === 0) {
    pw.close()
  } else {
    pw.addDescription(Utils.getString('uread.click_on_close'))
  }

  if (dois.length > 0) {
    Zotero.launchURL('http://uread.today/add-catalogue-compare?dois=' + dois.join(','))
  }
}

site.startCatalogueCompare = function () {
  Zotero.launchURL('http://uread.today/catalogue-compare')
}

site.checkUrl = function (url) {
  if (!url) return false

  var ret = url.match(/(uread.today)|(uread.today)/g)

  /* eslint-disable no-undef */
  return ret && ret.length > 0
}

site.home = function () {
  Zotero.launchURL('http://uread.today?from=zotero')
}

if (typeof window !== 'undefined') {
  // API export for Zotero UI
  // Can't imagine those to not exist tbh
  if (!window.Zotero) window.Zotero = {}
  if (!window.Zotero.uRead) window.Zotero.uRead = {}
  if (!window.Zotero.uRead.Site) window.Zotero.uRead.Site = {}
  // note sure about any of this
  window.Zotero.uRead.Site.embody = function () { site.embody() }
  window.Zotero.uRead.Site.refresh = function () { site.refresh() }
  window.Zotero.uRead.Site.openaschrome = function () { site.openaschrome() }
  window.Zotero.uRead.Site.quickview = function () { site.quickview() }

  window.Zotero.uRead.Site.clcinfo = function () { site.clcinfo() }
  window.Zotero.uRead.Site.subjectinfo = function () { site.subjectinfo() }
  window.Zotero.uRead.Site.authorinfo = function () { site.authorinfo() }
  window.Zotero.uRead.Site.publisherinfo = function () { site.publisherinfo() }

  window.Zotero.uRead.Site.translate = function () { site.translate() }
  window.Zotero.uRead.Site.restoretranslate = function () { site.restoretranslate() }

  window.Zotero.uRead.Site.addCatalogueCompare = function () { site.addCatalogueCompare() }
  window.Zotero.uRead.Site.startCatalogueCompare = function () { site.startCatalogueCompare() }

  window.Zotero.uRead.Site.home = function () { site.home() }
  window.Zotero.uRead.Site.checkUrl = function (url) { return site.checkUrl(url) }
  window.Zotero.uRead.Site.authorsinfo = function (author) { site.authorsinfo(author) }
} else {
  Zotero.debug('uRead@window is null.')
}

if (typeof module !== 'undefined') module.exports = site
