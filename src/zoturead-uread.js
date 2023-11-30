if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.uRead) Zotero.ZotURead.uRead = {};

Zotero.ZotURead.uRead.refresh = async function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  
  pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-refresh'))
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))

  for (const item of zitems) {
    let url = item.getField('url')
    if (!this.checkUrl(url)) {
      pw.addLines(item.getField('title') + '，非今日优读抓取，已跳过。', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
      continue
    }
    let doi = Zotero.ZotURead.Utils.getUrlParam(url, 'doi')
    Zotero.HTTP.doGet('http://api.uread.today/master/anon/book/get?doi=' + doi, function (request) {
      if (request.status === 200) {
        
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
              
              let json = JSON.parse(request.responseText)
              if (json.resultcode !== 1) {
                return
              }

              let catalogue = ''
              let maxtier = 1
              for (let content of json.data) {
                maxtier = Math.max(content.tier, maxtier)
              }
              for (let content of json.data) {
                catalogue += '　'.repeat(content.tier - 1) + (maxtier > 1 && content.tier === 1 ? '<b>' : '') + content.content + (maxtier > 1 && content.tier === 1 ? '</b>' : '') + '<br >'
              }
              Zotero.ZotURead.Tools.newCatalogue(item, cover_url, catalogue, '目录')

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

Zotero.ZotURead.uRead.embody = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  

  let item = zitems[0]

  let isbn = item.getField('ISBN').replace(/-/g, '')
  Zotero.launchURL('http://uread.today/embody?isbn=' + isbn)
}

Zotero.ZotURead.uRead.quickview = async function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }

  Zotero.openInViewer(zitems[0].getField('url'))
}

Zotero.ZotURead.uRead.openaschrome = async function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  for (const item of zitems) {
    let url = item.getField('url')
    Zotero.Utilities.Internal.exec('/usr/bin/open', ['-a', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', url])
  }
}

Zotero.ZotURead.uRead.clcinfo = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  

  let item = zitems[0]

  let clc = item.getField('archiveLocation')
  if (clc && /^[A-Z][A-B|0-9|/|-|\\.]+$/g.exec(clc)) {
    Zotero.launchURL('http://uread.today/clc?c=' + clc)
  } else {
    Zotero.ZotURead.Messages.warning(`${item.getField('title')}无中图分类信息，可先通过「工具」-「修复中图分类号」获取中图分类号。`)
  }
}

Zotero.ZotURead.uRead.subjectinfo = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  

  let item = zitems[0]

  let subject = item.getField('archive')
  if (subject && /^\d{3,7}$/g.exec(subject)) {
    Zotero.launchURL('http://uread.today/subject?c=' + subject)
  } else {
    Zotero.ZotURead.Messages.warning(`${item.getField('title')}无学科信息，可先通过「工具」-「修复学科号」获取学科号。`)
  }
}

Zotero.ZotURead.uRead.authorsinfo = function (author) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }

  let item = zitems[0]
  let url = item.getField('url')
  if (!this.checkUrl(url)) {
    // 搜索
    Zotero.launchURL('http://uread.today/authors?q=' + author)
    return
  }
  let doi = Zotero.ZotURead.Utils.getUrlParam(url, 'doi')
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title'))
  pw.addLines('处理中...', `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`)
  pw.show()
  Zotero.HTTP.doGet('http://api.uread.today/master/anon/book/get?doi=' + doi, function(request) {
    pw.close()
    if (request.status === 200) {
      
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
        Zotero.ZotURead.Messages.warning(`《${item.getField('title')}》无${author}信息。`)
      } else {
        Zotero.ZotURead.Messages.warning(`《${item.getField('title')}》获取作者信息异常，${json.message}`)
      }
    } else if (request.status === 0) {
      Zotero.ZotURead.Messages.warning(`${request.status} - 网络错误。`)
    } else {
      Zotero.ZotURead.Messages.warning(`${request.status} - ${request.statusText}`)
    }
  }.bind(this))
}

Zotero.ZotURead.uRead.publisherinfo = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  

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
    Zotero.ZotURead.Messages.warning(`《${item.getField('title')}》无出版社信息。`)
  }
}

Zotero.ZotURead.uRead.translate = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  

  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline('转化为今日优读')
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()

  for (const item of zitems) {
    if (item.getField('url').startsWith('http://uread.today')) {
      let itemProgress = new pw.ItemProgress(
        `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`,
        `${item.getField('title')}，无需转化。`
      )
      itemProgress.setProgress(100)
      continue
    }
    let itemProgress = new pw.ItemProgress(
      `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
      `${item.getField('title')}`
    )
    itemProgress.setProgress(50)
    let isbn = item.getField('ISBN').replace(/-/g, '')
    let url = 'http://api.uread.today/master/anon/book/get?isbn=' + isbn
    Zotero.HTTP.doGet(url, function (request) {
      if (request.status === 200) {
        
        let json = JSON.parse(request.responseText)
        if (json && json.resultcode === 1) {
          let doi = json.data
          let oldUrl = item.getField('url')
          let newUrl = 'http://uread.today/book?doi=' + doi + '&src=' + oldUrl
          item.setField('url', newUrl)
          item.saveTx()
          
          itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${item.getField('title')}，转化成功。`)
        } else {
          itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${item.getField('title')}，未收录${isbn}，请先收录。`)
          Zotero.launchURL('http://uread.today/embody?isbn=' + isbn)
        }
      } else if (request.status === 0) {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setProgress(100)
        itemProgress.setText(`${item.getField('title')}，${request.status} - 网络错误。`)
      } else {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setProgress(100)
        itemProgress.setText(`${request.status} - ${request.statusText}`)
      }
    }.bind(this))
  }
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
}

Zotero.ZotURead.uRead.restoretranslate = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  

  let item = zitems[0]
  let oldUrl = item.getField('url')
  let newUrl = Zotero.ZotURead.Utils.getUrlParam(oldUrl, 'src')
  if (newUrl) {
    item.setField('url', newUrl)
    item.saveTx()
    
    Zotero.ZotURead.Utils.success('还原转化成功。')
  } else {
    Zotero.ZotURead.Messages.warning('无法还原转化。')
  }
}

Zotero.ZotURead.uRead.addCatalogueCompare = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book']);
  if (!zitems || zitems.length <= 0) {;
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  

  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title'))
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
    let doi = Zotero.ZotURead.Utils.getUrlParam(url, 'doi')
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
  

  if (count === 0) {
    pw.close()
  } else {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }

  if (dois.length > 0) {
    Zotero.launchURL('http://uread.today/add-catalogue-compare?dois=' + dois.join(','))
  }
}

Zotero.ZotURead.uRead.startCatalogueCompare = function () {
  Zotero.launchURL('http://uread.today/catalogue-compare');
}

Zotero.ZotURead.uRead.checkUrl = function (url) {
  if (!url) return false;

  var ret = url.match(/(uread.today)|(uread.today)/g);

  /* eslint-disable no-undef */
  return ret && ret.length > 0;
}

Zotero.ZotURead.uRead.home = function () {
  Zotero.launchURL('http://uread.today?from=zotero');
}
