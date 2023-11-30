if (!Zotero.ZotURead) Zotero.ZotURead = {};
if (!Zotero.ZotURead.Tools) Zotero.ZotURead.Tools = {};

Zotero.ZotURead.Tools.expandSelectedRows = function () {
  Zotero.getMainWindow().ZoteroPane.itemsView.expandAllRows();
}

Zotero.ZotURead.Tools.collapseSelectedRows = function () {
  Zotero.getMainWindow().ZoteroPane.itemsView.collapseAllRows();
}

Zotero.ZotURead.Tools.pullCatalogue = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  var pw = new Zotero.ProgressWindow()
  pw.changeHeadline('拉目录')
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()

  var promises = []
  for (const zitem of zitems) {
    let itemProgress = new pw.ItemProgress(
      `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
      `${zitem.getField('title')} ...`
    )
    itemProgress.setProgress(50)
    var url = zitem.getField('url')

    this.pullCatalogueByURead(url, zitem, itemProgress, promises)
  }

  Promise.all(promises).then((result) => {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }).catch((error) => {
    pw.addLines(error)
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  })
}

Zotero.ZotURead.Tools.getDoubanIDFromURL = function (url) {
  if (!url) return ''

  var id = url.match(/subject\/.*\//g)
  if (!id) return ''

  return id[0].replace(/subject|\//g, '')
}

Zotero.ZotURead.Tools.pullCatalogueByURead = function (url, zitem, itemProgress, promises) {
  itemProgress.setText(`${zitem.getField('title')}，尝试在今日优读搜索...`)
  var isbn = zitem.getField('ISBN').replace(/-/g, '')

  Zotero.HTTP.doGet(`http://api.uread.today/master/anon/book/get?isbn=${isbn}`, function (request) {
    if (request.status === 200) {
      let json = JSON.parse(request.responseText)
      if (json && json.resultcode === 1) {
        let doi = json.data
        
        Zotero.HTTP.doGet('http://api.uread.today/master/anon/book/get?doi=' + doi, function (request) {
          if (request.status === 200) {
            let json = JSON.parse(request.responseText)
            if (json && json.resultcode === 1) {
              let book = json.data
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
                  Zotero.ZotURead.Tools.newCatalogue(zitem, cover_url, catalogue, '目录')

                  itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
                  itemProgress.setProgress(100)
                  itemProgress.setText(`${zitem.getField('title')}，在今日优读找到目录。`)
                } else if (request.status === 0) {
                  itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
                  itemProgress.setProgress(100)
                  itemProgress.setText(`${item.getField('title')}，${request.status} - 网络错误。`)
                  pw.addLines(`抓取 ${item.getField('title')} 目录失败 - 网络错误。`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
                } else {
                  itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
                  itemProgress.setProgress(100)
                  itemProgress.setText(`${item.getField('title')}，${request.status} 目录失败 - ${request.statusText}`)
                }
              })
            } else {
              itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
              itemProgress.setProgress(100)
              itemProgress.setText(`${item.getField('title')}，${json.message}`)
            }
          } else if (request.status === 0) {
            itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${item.getField('title')}，${request.status} - 网络错误。`)
          } else {
            itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${item.getField('title')}，${request.status} - ${request.statusText}`)
          }
        }.bind(this))
      } else {
        this.pullCatalogueByDouban(url, zitem, itemProgress, promises)
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

Zotero.ZotURead.Tools.pullCatalogueByDouban = function (url, zitem, itemProgress, promises) {
  itemProgress.setText(`${zitem.getField('title')}，尝试在豆瓣搜索...`)
  var isbn = zitem.getField('ISBN').replace(/-/g, '')
  if (url.includes('douban.com')) {
    let id = this.getDoubanIDFromURL(url)
    promises.push(Zotero.HTTP.processDocuments(url, async function (doc) {
      var found = false
      var e = doc.querySelector('#dir_' + id + '_full')
      if (e) {
        var dir = e.textContent
        if (dir) {
          dir = dir.replace('· · · · · ·     (收起)', '')
          var img = doc.querySelector('.nbg').href
          Zotero.ZotURead.Tools.newCatalogue(zitem, img, dir, '目录')
          found = true

          itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${zitem.getField('title')}，在豆瓣找到目录。`)
        }
      }

      if (!found) {
        this.pullCatalogueByJD(isbn, zitem, itemProgress, promises)
      }
    }.bind(this)))
  } else {
    this.pullCatalogueByJD(isbn, zitem, itemProgress, promises)
  }
}

Zotero.ZotURead.Tools.pullCatalogueByJD = function (isbn, zitem, itemProgress, promises) {
  itemProgress.setText(`${zitem.getField('title')}，尝试在京东搜索...`)
  promises.push(Zotero.HTTP.processDocuments('https://search.jd.com/Search?keyword=' + isbn + '&shop=1&click=1', async function (doc1) {
    var lis = doc1.querySelectorAll('#J_goodsList ul li.gl-item')
    if (lis.length === 0) {
      this.pullCatalogueByDangDang(isbn, zitem, pw, promises)
    } else {
      var hasJD = false
      for (var li of lis) {
        var icons = li.querySelector('.p-icons').innerText
        hasJD = icons.includes('自营')
        if (hasJD) {
          var img = 'https:' + li.querySelector('.p-img img').dataset.lazyImg

          var showdesc = function(json) {
            var parser = new DOMParser()
            var xml = parser.parseFromString(json.content, 'text/html')
            var content = xml.querySelector('[text="目录"] .book-detail-content')
            if (content) {
              var dir = content.innerHTML
              Zotero.ZotURead.Tools.newCatalogue(zitem, img, dir, '目录')

              itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
              itemProgress.setProgress(100)
              itemProgress.setText(`${zitem.getField('title')}，在京东找到目录。`)
            } else {
              this.pullCatalogueByDangDang(isbn, zitem, itemProgress, promises)
            }
          }.bind(this)

          var sku = li.dataset.sku
          promises.push(Zotero.HTTP.doGet('https://dx.3.cn/desc/' + sku + '?encode=utf-8', async function (doc2) {
            if (doc2.responseText.length > 0) {
              eval(doc2.responseText)
            } else {
              this.pullCatalogueByDangDang(isbn, zitem, itemProgress, promises)
            }
          }.bind(this)))

          break
        }
      }

      if (!hasJD) {
        this.pullCatalogueByDangDang(isbn, zitem, itemProgress, promises)
      }
    }
  }.bind(this)))
}

Zotero.ZotURead.Tools.pullCatalogueByDangDang = function (isbn, zitem, itemProgress, promises) {
  itemProgress.setText(`${zitem.getField('title')}，尝试在搜索查找...`)
  promises.push(Zotero.HTTP.processDocuments('http://search.dangdang.com/?key=' + isbn + '&act=input&filter=0%7C0%7C0%7C0%7C0%7C1%7C0%7C0%7C0%7C0%7C0%7C0%7C0%7C0%7C0#J_tab', async function (doc1) {
    var lis = doc1.querySelectorAll('#search_nature_rg ul li')
    if (lis.length === 0) {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setProgress(100)
      itemProgress.setText(`${zitem.getField('title')}，未找到目录。`)
    } else {
      for (var li of lis) {
        var href = li.querySelector('a.pic').href
        var img = li.querySelector('a.pic img').src

        promises.push(Zotero.HTTP.processDocuments(href, async function (doc2) {
          var element = Object.values(doc2.scripts).find(element => element.textContent.includes('prodSpuInfo'))
          if (element) {
            var pattern = /var prodSpuInfo = {.+}/
            if (pattern.test(element.textContent)) {
              eval(pattern.exec(element.textContent)[0]);
              if (prodSpuInfo) {
                var productId = prodSpuInfo.productId
                var categoryPath = prodSpuInfo.categoryPath
                var describeMap = prodSpuInfo.describeMap
                var template = prodSpuInfo.template
                var shopId = prodSpuInfo.shopId
                var url0 = 'http://product.dangdang.com/index.php?r=callback%2Fdetail&productId=' + productId +
                  '&templateType=' + template + '&describeMap=' + describeMap + '&shopId=' + shopId + '&categoryPath=' + categoryPath

                promises.push(Zotero.HTTP.doGet(url0, async function (doc3) {
                  if (doc3.responseText.length > 0) {
                    var parser = new DOMParser()
                    var xml = parser.parseFromString(JSON.parse(doc3.responseText).data.html, 'text/html')
                    var content = xml.querySelector('#catalog-textarea')
                    if (content) {
                      var dir = content.innerText
                      dir += '<p><a href="' + href + '">点击查看全部</a></p>'
                      Zotero.ZotURead.Tools.newCatalogue(zitem, img, dir, '目录')

                      itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
                      itemProgress.setProgress(100)
                      itemProgress.setText(`${zitem.getField('title')}，在当当找到目录。`)
                    } else {
                      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
                      itemProgress.setProgress(100)
                      itemProgress.setText(`${zitem.getField('title')}，未找到目录。`)
                    }
                  } else {
                    itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
                    itemProgress.setProgress(100)
                    itemProgress.setText(`${zitem.getField('title')}，未找到目录。`)
                  }
                }.bind(this)))
              } else {
                itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
                itemProgress.setProgress(100)
                itemProgress.setText(`${zitem.getField('title')}，未找到目录。`)
              }
            } else {
              itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
              itemProgress.setProgress(100)
              itemProgress.setText(`${zitem.getField('title')}，未找到目录。`)
            }
          } else {
            itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${zitem.getField('title')}，未找到目录。`)
          }
        }.bind(this)))

        break
      }
    }
  }.bind(this)))
}

Zotero.ZotURead.Tools.newCatalogue = async function (item, coverUrl, catalogue, title) {
  let note
  for (let index = 0; index < item.getNotes().length; index++) {
    const noteid = item.getNotes()[index]
    let n = Zotero.Items.get(noteid)
    if (n.getNoteTitle() === title) {
      note = n
      break
    }
  }

  let notes = '<p><strong>' + title + '</strong></p>\n<p><img src="' + coverUrl + '" alt="" style="max-width: 135px; max-height: 200px;" /></p><p>' + catalogue.replace(/(([\xA0\s]*)\n([\xA0\s]*))+/g, '<br>').replace(/\n+/g, '<br>') + '</p>'

  var noteID
  if (note) {
    noteID = await note.saveTx()
  } else {
    note = new Zotero.Item('note')
    note.parentKey = item.getField('key')
    note.libraryID = Zotero.getMainWindow().ZoteroPane.getSelectedLibraryID()
    noteID = await note.saveTx()
  }
  note.setNote(notes)
  
  Zotero.getMainWindow().ZoteroPane.selectItem(noteID)
}

// deprecated
Zotero.ZotURead.Tools.tryRead = async function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])

  // 只支持一个，不然容易小黑屋。
  var zitem = zitems[0]
  var isbn = zitem.getField('ISBN').replace(/-/g, '')
  if (!isbn) {
    Zotero.ZotURead.Messages.warning('未找到ISBN。')
    return
  }

  var pw = new Zotero.ProgressWindow()
  pw.changeHeadline('下载正文试读/辅助页')
  pw.show()
  
  let itemProgress = new pw.ItemProgress(
    `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
    `请登陆...`
  )
  itemProgress.setProgress(50)

  var _this = this
  _this.superlib('http://www.ucdrs.superlib.net/login/login.action', function (doc) {
    var cookieSandbox = new Zotero.CookieSandbox(
      null,
      'http://book.ucdrs.superlib.net/',
      doc.cookie
    )
    var url = 'http://book.ucdrs.superlib.net/search?Field=all&channel=search&sw=' + isbn
    itemProgress.setText(`${zitem.getField('title')} 获取中...`)

    var found = false
    var tip = '试读'
    var promises = []
    promises.push(Zotero.HTTP.processDocuments(url, function (doc0) {
      let books = doc0.querySelectorAll('.book1')
      if (!books || books.length <= 0) {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setProgress(100)
        itemProgress.setText(`${zitem.getField('title')}，未找到试读。`)
        return
      }

      for (let book of books) {
        let a = book.querySelector('.book1 td>table a.px14')
        if (a) {
          let url0 = a.href.replace('chrome://zotero', 'http://book.ucdrs.superlib.net')
          // superlib 单本书籍查看

          let hiddenBrowser = Zotero.Browser.createHiddenBrowser()
          if (cookieSandbox) {
            cookieSandbox.attachToBrowser(hiddenBrowser)
          }
          hiddenBrowser.addEventListener('pageshow', async function () {
            var element = Object.values(hiddenBrowser.contentDocument.scripts).find(element => element.textContent.includes('send_requestajax'))
            if (element) {
              var pattern = /".*?"/
              if (pattern.test(element.textContent)) {
                let url1 = 'http://book.ucdrs.superlib.net/' + pattern.exec(element.textContent)[0].replace(/"/g, '')
                let request1 = await Zotero.ZotURead.Utils.requestAsync(url1, {
                  cookieSandbox
                })
                var htmlText = unescape(request1.responseText.trim())
                var html = (new DOMParser()).parseFromString(htmlText, 'text/html')
                var href
                for (var a of html.querySelectorAll('.link a')) {
                  if (a.textContent !== '图书馆文献传递') {
                    href = a.href.replace('chrome://zotero', 'http://book.ucdrs.superlib.net')
                    break
                  }
                }

                if (href) {
                  promises.push(Zotero.HTTP.processDocuments('http://book.ucdrs.superlib.net' + href, function (doc2) {
                    // 下载正文试读
                    let assistUrl = doc2.querySelector('#downpdf [name=assistUrl]').value
                    // 下载辅助页
                    let cntUrl = doc2.querySelector('#downpdf [name=cntUrl]').value

                    tip = ''
                    let added = false
                    if (assistUrl && !found) {
                      Zotero.Attachments.importFromURL({
                        'libraryID': zitem.libraryID,
                        'url': assistUrl,
                        'parentItemID': zitem.id,
                        'contentType': 'application/pdf',
                        'title': '正文试读'
                      })
                      tip = '正文试读'
                      added = true
                    }
                    if (cntUrl && !found) {
                      Zotero.Attachments.importFromURL({
                        'libraryID': zitem.libraryID,
                        'url': cntUrl,
                        'parentItemID': zitem.id,
                        'contentType': 'application/pdf',
                        'title': '辅助页(版权页、前言页、目录页)'
                      })
                      if (tip.length > 0) {
                        tip += '和'
                      }
                      tip += '辅助页'
                      added = true
                    }
                    found = true
                    if (added) {
                      itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
                      itemProgress.setText(`${zitem.getField('title')}，找到${tip}，下载需要时间，请耐心等候。`)
                    }
                  },
                  null,
                  function (e) {
                    itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
                    itemProgress.setProgress(100)
                    itemProgress.setText(`${zitem.getField('title')}，${e}`)
                  },
                  null,
                  cookieSandbox))
                } else {
                  itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
                  itemProgress.setProgress(100)
                  itemProgress.setText(`${zitem.getField('title')}，未找到试读信息。`)
                }
              } else {
                itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
                itemProgress.setProgress(100)
                itemProgress.setText(`${zitem.getField('title')}，未找到试读信息。`)
              }
            } else {
              itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
              itemProgress.setProgress(100)
              itemProgress.setText(`${zitem.getField('title')}，未找到试读信息。`)
            }
          }, true)
          hiddenBrowser.loadURI(url0)
        } else {
          itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${zitem.getField('title')}，未找到图书信息。`)
        }
      }
    },
    null,
    function (e) {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setProgress(100)
      itemProgress.setText(`${zitem.getField('title')}，${e}`)
    },
    null,
    cookieSandbox))

    Promise.all(promises).then((result) => {
    }).catch((error) => {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setText(error)
    }).finally(() => {
      itemProgress.setProgress(100)
      pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
    })
  }, function () {
    itemProgress.setText(`用户取消`)
    pw.close()
  })
}

Zotero.ZotURead.Tools.weread = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])

  // 只支持一个，不然容易小黑屋。
  var zitem = zitems[0]

  var pw = new Zotero.ProgressWindow()
  pw.changeHeadline('附加微信读书链接')
  pw.show()
  let itemProgress = new pw.ItemProgress(
    `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
    `${zitem.getField('title')} ...`
  )
  itemProgress.setProgress(50)

  Zotero.HTTP.doGet('https://weread.qq.com/web/search/global?keyword=' + zitem.getField('title') + '&maxIdx=0&fragmentSize=120&count=40', async function (request) {
    if (request.status === 200 || request.status === 201) {
      let res = JSON.parse(request.responseText)
      if (res.books && res.books.length > 0) {
        let bookId
        let paring = function (val) {
          return val.replace(/（/g, '')
            .replace(/）/g, '')
            .replace(/【|﹝|〔/g, '')
            .replace(/】|﹞|〕/g, '')
            .replace(/ *编|著|译|等|校/g, '')
            .replace(/翻译/g, '')
            .replace(/\(审校\)/g, '')
            .replace(/译校/g, '')
            .replace(/编译/g, '')
            .replace(/正校/g, '')
            .replace(/•|・|▪/g, '')
            .replace(/\] +/g, '')
            .replace(/ *· */g, '')
            .replace(/ /g, '')
            .replace(/．/g, '')
            .replace(/\. */g, '.')
        }
        for (let index = 0; index < res.books.length; index++) {
          const book = res.books[index]

          var creators = zitem.getCreators()
          if (creators) {
            for (const creator of creators) {
              let author = paring(book.bookInfo.author)
              let lastName = paring(creator.lastName || '')
              if (lastName && (lastName.startsWith(author) || lastName.endsWith(author) || author.startsWith(lastName) || author.endsWith(lastName))) {
                bookId = book.bookInfo.bookId
                break
              }
            }
          }

          if (bookId) {
            break
          }
        }

        if (bookId) {
          let urlid = this.createId(bookId)
          let url = `https://weread.qq.com/web/reader/${urlid}`
          Zotero.Attachments.linkFromURL({
            title: `微信读书《${zitem.getField('title')}》`,
            linkMode: 'linked_url',
            parentItemID: zitem.id,
            url: url
          })
          itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
          itemProgress.setText(`${zitem.getField('title')} 找到微信读书。`)
        } else {
          itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
          itemProgress.setText(`${zitem.getField('title')} 未找到微信读书。`)
        }
      } else {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setText(`${zitem.getField('title')} 未找到微信读书。`)
      }
    } else if (request.status === 0) {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setText(`${zitem.getField('title')} 出错 - 网络错误。`)
    } else {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setText(`${zitem.getField('title')} 出错，${request.status} - ${request.statusText}`)
    }
    itemProgress.setProgress(100)
  }.bind(this))
  pw.addDescription(this.getString('zotupdate.click_on_close'))
}

Zotero.ZotURead.Tools.createId = function (bookId) {
  let str = Zotero.Utilities.Internal.md5(bookId, false)
  let strSub = str.substr(0, 3)

  let func = function (id) {
    if (/^\d*$/.test(id)) {
      for (var len = id['length'], c = [], a = 0; a < len; a += 9) {
        var b = id['slice'](a, Math.min(a + 9, len))
        c['push'](parseInt(b)['toString'](16))
      }
      return ['3', c]
    }
    for (var d = '', i = 0; i < id['length']; i++) {
      d += id['charCodeAt'](i)['toString'](16)
    }
    return ['4', [d]]
  }

  let fa = func(bookId)
  strSub += fa[0],
  strSub += 2 + str['substr'](str['length'] - 2, 2)
  for (var m = fa[1], j = 0; j < m.length; j++) {
    var n = m[j].length.toString(16)
    1 === n['length'] && (n = '0' + n), strSub += n, strSub += m[j], j < m['length'] - 1 && (strSub += 'g')
  }
  return strSub.length< 20 && (strSub += str.substr(0, 20 - strSub.length)), strSub += Zotero.Utilities.Internal.md5(strSub, false).substr(0, 3)
}

Zotero.ZotURead.Tools.clearupAll = function () {
  var items = [{
    id: 'clearupAuthor',
    label: '作者(整理成类似 [美]格林·哈姆(Green Hamm) 的格式)',
    checked: true
  }, {
    id: 'clearupNationality',
    label: '作者去国籍([美]格林·哈姆 变成 格林·哈姆)',
    checked: true
  }, {
    id: 'clearupExtra1',
    label: '其他(去掉Translators: _:n...)',
    checked: true
  }, {
    id: 'clearupExtra2',
    label: '其他(去掉ZSCC: NoCitationData[s0])',
    checked: true
  }, {
    id: 'clearupTags',
    label: '清空自动标签(非自定义标签)',
    checked: true
  }, {
    id: 'clearupTitle',
    label: '标题(全角括号转为半角)',
    checked: true
  }, {
    id: 'clearupAbstractNote',
    label: '摘要(•转为·)',
    checked: true
  }, {
    id: 'mergecatalog',
    label: '合并目录',
    checked: true
  }, {
    id: 'mergename',
    label: '合并姓名',
    checked: true
  }, {
    id: 'clearupinitial',
    label: '清除初步评价',
    checked: true
  }, {
    id: 'clearupcomment',
    label: '清除豆瓣短评',
    checked: true
  }];
  let dataOut = Zotero.ZotURead.Dialogs.openSelectItems(items);

  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  var pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()

  if (dataOut) {
    dataOut.forEach(element => {
      let id = element.id
      if (Zotero.ZotURead.Tools[id]) {
        Zotero.ZotURead.Tools[id](pw)
      } else {
        Zotero.ZotURead.Logger.log(id);
      }
    })
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  } else {
    pw.close()
  }
}

Zotero.ZotURead.Tools.clearupAuthor = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {

    var creators = zitem.getCreators()
    if (creators) {
      for (const creator of creators) {
        let lastName = (creator.lastName || '')
        lastName = this._parsing(lastName)
        if (creator.lastName !== lastName) {
          pw.addLines(creator.lastName + ' >>> ' + lastName, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
        } else {
          pw.addLines(creator.lastName + '无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
        }
        creator.lastName = lastName
      }
    }
    zitem.setCreators(creators)
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupNationality = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {

    var creators = zitem.getCreators()
    if (creators) {
      for (const creator of creators) {
        let lastName = (creator.lastName || '')
        lastName = lastName.replace(/^\[.*?\]/g, '')
        if (creator.lastName !== lastName) {
          pw.addLines(creator.lastName + ' >>> ' + lastName, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
          creator.lastName = lastName
        } else {
          pw.addLines(creator.lastName + '无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
        }
      }
    }
    zitem.setCreators(creators)
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupExtra1 = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {

    let extra = zitem.getField('extra')
    if (extra && extra.startsWith('Translators: _:n') && extra.includes('\n')) {
      let _extra = extra.split('\n')[1]
      zitem.setField('extra', _extra)
      pw.addLines(extra + ' >>> ' + _extra, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    } else {
      pw.addLines(extra + '无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupExtra2 = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {

    var extra = zitem.getField('extra')
    if (extra.includes('ZSCC: NoCitationData[s0]')) {
      zitem.setField('extra', extra.replace(/ZSCC: NoCitationData\[s0\]\n?/g, ''))
      pw.addLines('去掉 ZSCC: NoCitationData[s0] 成功。', `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    } else {
      pw.addLines(extra + '无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupTags = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {
    let tags = zitem.getTags()
    let _tags = []
    let tagsString = []
    let _tagsString = []
    tags.forEach(element => {
      tagsString.push(element.tag)
      if (!element.type || element.type !== 1) {
        _tags.push(element)
        _tagsString.push(element.tag)
      }
    })
    if (tagsString.length !== _tagsString.length) {
      zitem.setTags(_tags)
      if (_tagsString.length === 0) {
        pw.addLines(tagsString.join(',') + '全部清除', `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
      } else {
        pw.addLines(tagsString.join(',') + ' >>> ' + _tagsString.join(','), `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
      }
    } else {
      pw.addLines(tagsString.join(',') + '无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupTitle = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {
    var title = zitem.getField('title') || ''
    var _title = title.replace(/[\(|（](.*?)[\)|）]/g, '($1)')
    if (title !== _title) {
      zitem.setField('title', _title)
      pw.addLines(title + ' >>> ' + _title, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    } else {
      pw.addLines(title + '无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupAbstractNote = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {

    var abstractNote = zitem.getField('abstractNote') || ''
    var _abstractNote = abstractNote.replace(/•/g, '·')
    if (abstractNote !== _abstractNote) {
      zitem.setField('abstractNote', _abstractNote)
      pw.addLines('简介', `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    } else {
      pw.addLines('简介无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.mergecatalog = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {
    let lastDateModified = '1970-01-01 00:00:00'
    let lastNoteID = 0
    let catalogs = 0
    for (const noteID of zitem.getNotes()) {
      let note = Zotero.Items.get(noteID)
      if (note.getNoteTitle() === '目录') {
        let dateModified = note.getField('dateModified')
        if (dateModified > lastDateModified) {
          lastDateModified = dateModified
          if (lastNoteID > 0) {
            Zotero.Items.trashTx(lastNoteID)
            catalogs++
          }
          lastNoteID = noteID
        } else {
          Zotero.Items.trashTx(noteID)
          catalogs++
        }
      }
    }
    pw.addLines(`${zitem.getField('title')} ${catalogs > 0 ? '合并成功。' : '无需合并。'}`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.mergename = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  for (const zitem of zitems) {

    let ret = false
    var creators = zitem.getCreators()
    if (creators) {
      for (const creator of creators) {
        if (creator.lastName !== creator.firstName) {
          creator.lastName = creator.lastName + creator.firstName
        }
        creator.firstName = ''
        creator.fieldMode = 1
        ret = true
      }
    }
    zitem.setCreators(creators)
    zitem.saveTx()

    if (ret) {
      pw.addLines(`${zitem.getField('title')} 作者合并成功。`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    }
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupinitial = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  let found = false
  for (const zitem of zitems) {
    for (const noteID of zitem.getNotes()) {
      let note = Zotero.Items.get(noteID)
      if (note.getNoteTitle() === '初步评价') {
        Zotero.Items.trashTx(noteID)
        pw.addLines(`${zitem.getField('title')} 移除初步评价成功。`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
        found = true
      }
    }
  }
  if (!found) {
    pw.addLines(`无需处理。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.clearupcomment = function (pw) {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-clearup'))
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
    pw.show()
  }

  let found = false
  for (const zitem of zitems) {
    for (const noteID of zitem.getNotes()) {
      let note = Zotero.Items.get(noteID)
      if (note.getNoteTitle() === '豆瓣短评') {
        Zotero.Items.trashTx(noteID)
        pw.addLines(`${zitem.getField('title')} 移除豆瓣短评成功。`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
        found = true
      }
    }
  }
  if (!found) {
    pw.addLines(`无需处理。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }
}

Zotero.ZotURead.Tools.updateRating = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book', 'journalArticle', 'thesis'])

  var pw = new Zotero.ProgressWindow()
  pw.changeHeadline('更新')
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()

  var promises = []
  for (const zitem of zitems) {
    let itemProgress = new pw.ItemProgress(
      `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
      `${zitem.getField('title')} ...`
    )
    itemProgress.setProgress(50)

    var url = zitem.getField('url')
    if (url.includes('douban.com')) {
      promises.push(Zotero.HTTP.processDocuments(url, function (doc) {
        var target = doc.querySelector('strong[property*="v:average"]')
        if (target) {
          var rating = target.textContent
          if (rating && (rating = rating.trim()).length >= 1) {
            var ratingPeople = doc.querySelector('div.rating_sum a.rating_people span[property="v:votes"]').textContent
            if (!ratingPeople || ratingPeople.toString().trim().length <= 0) {
              ratingPeople = 0
            }
            var txt = rating + '/' + ratingPeople
            zitem.setField('extra', txt)
            zitem.saveTx()

            itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${zitem.getField('title')}，更新豆瓣评分成功：${txt}。`)
          } else {
            itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${zitem.getField('title')}，无豆瓣评分。`)
          }
        } else {
          itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${zitem.getField('title')}，无豆瓣评分。`)
        }
      }.bind(this)).catch(function (e) {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setProgress(100)
        itemProgress.setText(`${zitem.getField('title')}，${e}`)
      }))
    } else if (url.includes('cnki.net')) {
      var dbcode = url.match(/[?&]dbcode=([^&#]*)/i)
      var filename = url.match(/[?&]filename=([^&#]*)/i)
      let url0 = 'https://kns.cnki.net/kcms/detail/block/refcount.aspx?dbcode=' + dbcode[1].replace(/\d*/g, '') + '&filename=' + filename[1]
      promises.push(Zotero.HTTP.doGet(url0, function (res) {
        if (res.status === 200 && !res.responseText && res.responseText.length > 0) {
          try {
            var json = JSON.parse(res.responseText.replace(/'/g, '"'))
            zitem.setField('extra', json.CITING)
            zitem.saveTx()

            itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${zitem.getField('title')}，更新知网引用数成功：${json.CITING}。`)
          } catch (error) {
            itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${zitem.getField('title')}，${error}`)
          }
        } else {
          itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${zitem.getField('title')}，无知网引用数。`)
        }
      }))
    } else {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setProgress(100)
      itemProgress.setText(`${zitem.getField('title')}，非豆瓣或知网条目。`)
    }
  }

  Promise.all(promises).then((result) => {
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  }).catch((error) => {
    pw.addLines(error)
    pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
  })
}

// deprecated
Zotero.ZotURead.Tools.fixclc = function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }

  let item = zitems[0]
  this._fixclc(item, (clc) => {
  })
}

Zotero.ZotURead.Tools.fixsubject = async function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-fix'))
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()

  for (const item of zitems) {
    let itemProgress = new pw.ItemProgress(
      `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
      `${item.getField('title')}`
    )
    itemProgress.setProgress(50)
    let clc = item.getField('archiveLocation')
    if (!clc) {
      itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
      itemProgress.setProgress(100)
      itemProgress.setText(`${item.getField('title')}，无法获得学科信息，跳过。`)
      continue
    }
    let request = await this._clcinfo(clc)
    if (request.status === 200) {
      let json = JSON.parse(request.response)
      if (json && json.resultcode === 1) {
        let book = json.data
        if (book.subject) {
          item.setField('archive', book.subject.code)
          item.saveTx()
          itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${item.getField('title')}`)
        } else {
          itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${item.getField('title')}，无法获得学科信息，跳过。`)
        }
      } else {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setProgress(100)
        itemProgress.setText(`${item.getField('title')}，${json.message}`)
      }
    } else if (request.status === 0) {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setProgress(100)
      itemProgress.setText(`${request.status} - 网络错误。`)
    } else {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setProgress(100)
      itemProgress.setText(`${request.status} - ${request.statusText}`)
    }
  }
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
}

Zotero.ZotURead.Tools.movearchivebyclc = async function () {
  await this._archivebyclc(true)
}

// deprecated
Zotero.ZotURead.Tools.archivebyclc = async function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }

  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-archive'))
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()

  for (const zitem of zitems) {
    let clc = zitem.getField('archiveLocation')
    if (!clc) {
      pw.addLines(`${zitem.getField('title')}，请先修复中图分类信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    } else {
      let request = await this._clcinfo(clc)
      if (request.status === 200) {
        let json = JSON.parse(request.responseText)
        if (json && json.resultcode === 1) {
          if (json.data.clc) {
            this._archive(zitem, json.data.clc, function (collection) {
              if (collection) {
                pw.addLines(`${zitem.getField('title')} 已归档至 ${Zotero.ZotURead.Tools.showPath(collection.id)}`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
              } else {
                pw.addLines(`${zitem.getField('title')}，未找到${clcs[0].code}的中图目录。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
              }
            })
          } else {
            pw.addLines(`${zitem.getField('title')}，未找到学科信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          }
        }
      } else if (request.status === 0) {
        pw.addLines(`${request.status} - 网络错误。`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      } else {
        pw.addLines(`${request.status} - ${request.statusText}`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      }
    }
  }
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
}

Zotero.ZotURead.Tools._clcinfo = async function (clc) {
  let request = await Zotero.HTTP.request(
    'GET',
    'http://api.uread.today/master/anon/ch_lib_cls/info?code=' + clc,
    {
      noCache: true,
      responseType: 'text'
    }
  )
  if (request.status === 200) {
    let json = JSON.parse(request.responseText)
    if (json && json.resultcode === 40000) {
      if (clc.includes('.')) {
        return this._clcinfo(clc.replace(/\.\d*$/, ''))
      } else {
        return this._clcinfo(clc.replace(/\d$/, ''))
      }
    }
  }

  return request
}

Zotero.ZotURead.Tools.archive = async function () {
  var zitems = Zotero.ZotURead.Items.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotURead.Messages.warning(Zotero.ZotURead.L10ns.getString('zoturead-nonsupport'))
    return
  }

  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-archive'))
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-choose', {length: zitems.length}))
  pw.show()

  for (const zitem of zitems) {
    let subject = zitem.getField('archive')
    if (!subject) {
      let clc = zitem.getField('archiveLocation')
      if (!clc) {
        pw.addLines(`${zitem.getField('title')}，请先修复中图分类信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
      } else {
        let request = await this._clcinfo(clc)
        if (request.status === 200) {
          let json = JSON.parse(request.responseText)
          if (json && json.resultcode === 1) {
            if (json.data.subject) {
              zitem.setField('archive', json.data.subject.code)
              this._archive(zitem, json.data.subject, function (collection) {
                if (collection) {
                  pw.addLines(`${zitem.getField('title')} 已归档至 ${Zotero.ZotURead.Tools.showPath(collection.id)}`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
                } else {
                  pw.addLines(`${zitem.getField('title')}，未找到${subjects[0].code}的学科目录。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
                }
              })
            } else {
              pw.addLines(`${zitem.getField('title')}，未找到学科信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
            }
          }
        } else if (request.status === 0) {
          pw.addLines(`${request.status} - 网络错误。`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        } else {
          pw.addLines(`${request.status} - ${request.statusText}`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        }
      }
    } else if (subject && /^\d{3,7}$/g.exec(subject)) {
      let request = await Zotero.HTTP.request(
        'GET',
        'http://api.uread.today/master/anon/subject/info?code=' + subject,
        {
          noCache: true,
          responseType: 'text'
        }
      )
      if (request.status === 200) {
        let json = JSON.parse(request.response)
        if (json) {
          if (json.resultcode === 1) {
            if (json.data.subject) {
              this._archive(zitem, json.data.subject, function (collection) {
                if (collection) {
                  pw.addLines(`${zitem.getField('title')} 已归档至 ${Zotero.ZotURead.Tools.showPath(collection.id)}`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
                } else {
                  pw.addLines(`${zitem.getField('title')}，未找到${subjects[0].code}的学科目录。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
                }
              })
            } else {
              pw.addLines(`${zitem.getField('title')}，未找到学科信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
            }
          } else {
            pw.addLines(`${zitem.getField('title')}，${json.message}。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          }
        } else {
          pw.addLines(`${zitem.getField('title')}，未找到学科信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
        }
      } else if (request.status === 0) {
        pw.addLines(`${request.status} - 网络错误。`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      } else {
        pw.addLines(`${request.status} - ${request.statusText}`, `chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      }
    } else {
      pw.addLines(`${zitem.getField('title')}，无效学科信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
  }
  pw.addDescription(Zotero.ZotURead.L10ns.getString('zoturead-click_on_close'))
}

Zotero.ZotURead.Tools._archive = async function (zitem, obj, callback) {
  let parents = [...obj.parents]
  parents.push(obj)

  let collection = Zotero.ZotURead.Collections.loopSearchCollection(undefined, parents[0].code)
  if (!collection) {
    // 未找到
    callback()
  } else {
    /*
    let subjectContents = ''
    for (let index = 1; index < parents.length; index++) {
      const element = parents[index]
      let code = element.code
      let name = element.name
      subjectContents += `${code}. ${name} ‣`
    }
    subjectContents += `${obj.code}. ${obj.name} ‣`*/
    let dataIn = {
      desc: `${zitem.getField('title')}`,
      items: []
    }

    let parentPath = `${Zotero.ZotURead.Tools.showPath(collection.id)}`
    for (let index = 0; index < parents.length; index++) {
      const element = parents[index]
      parentPath += index === 0 ? '' : ` ▸ ${element.code}. ${element.name}`
      dataIn.items.push({
        id: element.code,
        label: parentPath,
        name: element.name
      })
    }
  
    let dataOut = Zotero.ZotURead.Dialogs.openArchive(dataIn);

    if (dataOut) {
      let collectionid
      if (dataOut.selectedIndex === 0) {
        collectionid = collection.id
      } else {
        for (let index = 1; index <= dataOut.selectedIndex; index++) {
          const element = parents[index]
          let code = element.code
          let name = element.name
          let ret = await Zotero.ZotURead.Collections.searchCollection(collection.key, code, name)
          collection = ret.collection
          collectionid = ret.collection.id
        }
      }

      if (collectionid) {
        let collections = []
        if (dataOut.mode === 'copy') {
          collections.push(...zitem.getCollections())
        }
        collections.push(collectionid)
        zitem.setCollections(collections)
        await zitem.saveTx()
        callback(collection)
      }
    }
  }
}

Zotero.ZotURead.Tools.location = function (collectionID, itemID) {
  Zotero.ZotURead.Logger.ding();
  
  Zotero.getMainWindow().ZoteroPane.collectionsView.selectCollection(parseInt(collectionID))
  Zotero.getMainWindow().ZoteroPane.selectItem(parseInt(itemID))
}

Zotero.ZotURead.Tools.showPath = function (collectionID) {
  let collectionNames = []
  collectionNames.push(Zotero.Collections.get(collectionID).name)
  let parentID = collectionID
  let lastCollection = Zotero.Collections.get(collectionID)
  while ((parentID = Zotero.Collections.get(parentID).parentID)) {
    collectionNames.push(Zotero.Collections.get(parentID).name)
    lastCollection = Zotero.Collections.get(parentID)
  }
  collectionNames.push(Zotero.Libraries.get(lastCollection.libraryID).name)
  return collectionNames.reverse().join(' ▸ ')
}

Zotero.ZotURead.Tools._parsing = function (author) {
  let prefix
  let name = author
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/【|﹝|〔/g, '[')
    .replace(/】|﹞|〕/g, ']')
    .replace(/ *编|著|译|等|校/g, '')
    .replace(/翻译/g, '')
    .replace(/\(审校\)/g, '')
    .replace(/译校/g, '')
    .replace(/编译/g, '')
    .replace(/正校/g, '')
    .replace(/[\(|（](.*?)[\)|）]/g, '($1)')
    .replace(/•|・|▪/g, '·')
    .replace(/\] +/g, ']')
    .replace(/ *· */g, '·')
    .replace(/ +([^A-Z])/g, '$1')
    .replace(/．/g, '.')
    .replace(/\. */g, '.')
    .replace(/(.*)\[(.*)\]/g, '[$2]$1')
    .replace(/\(\)/g, '')
  let ret = /^[\(|\[][\u4e00-\u9fa5]*[\)|\]]/g.exec(name)
  if (ret) {
    prefix = ret[0].replace(/\(|\)|\[|\]/g, '')
    name = name.replace(ret[0], '')
  }

  ret = /[\(|\[][A-Z|a-z| |\.|·]*[\)|\]]$/g.exec(name)
  let newEnName = ''
  if (ret) {
    let splits = ret[0].replace(/\(|\)|\[|\]/g, '').split(/ |\.|·/g)
    for (let index = 0; index < splits.length; index++) {
      const element = splits[index]
      if (!element) {
        continue
      }

      if (element.length <= 2 && /^[A-Z|a-z]+$/g.exec(element)) {
        newEnName += (element.length == 1 ? element.toUpperCase() : element) + '.' + (index == splits.length - 1 ? '' : ' ')
      } else {
        newEnName += element + (index == splits.length - 1 ? '' : ' ')
      }
    }
    name = name.replace(ret[0], '')
  }

  let newName = ''
  let splits = name.split(/ |\.|·/g)
  for (let index = 0; index < splits.length; index++) {
    const element = splits[index]
    if (!element) {
      continue
    }

    if (element.length <= 2 && /^[A-Z|a-z]+$/g.exec(element)) {
      newName += (element.length == 1 ? element.toUpperCase() : element) + '.' + (index == splits.length - 1 ? '' : ' ')
    } else {
      newName += element + (index == splits.length - 1 ? '' : '·')
    }
  }
  return (prefix ? ('[' + prefix + ']') : '') + newName + (newEnName ? ('(' + newEnName + ')') : '')
}

Zotero.ZotURead.Tools._fixclc = function (item, callback) {
  var isbn = item.getField('ISBN').replace(/-/g, '')
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotURead.L10ns.getString('zoturead-title-fix'))
  pw.show()
  let itemProgress = new pw.ItemProgress(
    `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
    `请登陆...`
  )
  itemProgress.setProgress(50)

  this.superlib('http://www.ucdrs.superlib.net/login/login.action', function (doc) {
    itemProgress.setText(`${item.getField('title')} 获取中...`)
    Zotero.HTTP.loadDocuments('http://book.ucdrs.superlib.net/search?Field=all&channel=search&sw=' + isbn, async function (doc) {
      if (doc.querySelector('.cent .font16')) {
        itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
        itemProgress.setProgress(100)
        itemProgress.setText(`${item.getField('title')}，对不起，您当前的IP不在我们服务的范围内。`)
        return
      }

      let books = doc.querySelectorAll('.book1')
      if (!books || books.length <= 0) {
        itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
        itemProgress.setProgress(100)
        itemProgress.setText(`${item.getField('title')}，无法获得中图分类信息。`)
        
        return
      }
      let found = false
      for (let book of books) {
        if (found) {
          break
        }
        let a = book.querySelector('.book1 td>table a.px14')
        if (a) {
          
          // superlib 单本书籍查看
          var url1 = a.href.replace('chrome://zotero', 'http://book.ucdrs.superlib.net')
          await Zotero.HTTP.loadDocuments(url1, async function (doc1) {
            let tubox = doc1.querySelector('.tubox dl').textContent
            let isbn1 = Zotero.ZotURead.Utils.opt(/【ISBN号】.*\n/.exec(tubox)).replace(/【ISBN号】|-|\n/g, '')
            
            if (Zotero.ZotURead.Utils.eqisbn(isbn, isbn1)) {
              let clc = Zotero.ZotURead.Utils.opt(Zotero.ZotURead.Utils.opt(/【中图法分类号】.*\n/.exec(tubox)).match(/[a-zA-Z0-9\.;]+/))
              if (clc) {
                
                item.setField('archiveLocation', clc)
                await item.saveTx()
                await callback(clc)
                found = true
                itemProgress.setIcon(`chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
                itemProgress.setProgress(100)
                itemProgress.setText(`${item.getField('title')}`)
              } else {
                itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
                itemProgress.setProgress(100)
                itemProgress.setText(`${item.getField('title')}，无法获得中图分类信息。`)
              }
            } else {
              itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
              itemProgress.setProgress(100)
              itemProgress.setText(`${item.getField('title')}，无法获得中图分类信息。`)
            }
          }.bind(this),
          null,
          function (e) {
            itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
            itemProgress.setProgress(100)
            itemProgress.setText(`${item.getField('title')}，${e}`)
          },
          null,
          new Zotero.CookieSandbox(
            null,
            'http://book.ucdrs.superlib.net/',
            doc.cookie
          ))
        } else {
          itemProgress.setIcon(`chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
          itemProgress.setProgress(100)
          itemProgress.setText(`${item.getField('title')}，无法获得中图分类信息。`)
        }
      }
    }.bind(this),
    null,
    function (e) {
      itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
      itemProgress.setProgress(100)
      itemProgress.setText(`${item.getField('title')}，${e}`)
    },
    null,
    new Zotero.CookieSandbox(
      null,
      'http://book.ucdrs.superlib.net/',
      doc.cookie
    ))
  }, function () {
    itemProgress.setText(`用户取消`)
    pw.close()
  })
}

// deprecated
Zotero.ZotURead.Tools.superlib = function (url, logined, close) {
  let ww = Components.classes['@mozilla.org/embedcomp/Zotero.getMainWindow()-watcher;1'].getService(Components.interfaces.nsIWindowWatcher);
  let arg = {
    uri: url,
    options: {
      onLoad: undefined
    }
  };
  arg.wrappedJSObject = arg;
  var win = ww.openWindow(null, 'chrome://zotero/content/standalone/basicViewer.xhtml', 'zotero:superlib', 'chrome,dialog=yes,resizable,centerscreen,menubar,scrollbars,height=600,width=800', arg);

  let browser;
  let func = function () {
    Zotero.ZotURead.Logger.log('load');
    
    win.removeEventListener('load', func);
    setTimeout(() => {
      browser = win.document.documentElement.getElementsByTagName('browser')[0];
      browser.addEventListener('pageshow', innerFunc);
    });
  }
  let funcclose = function () {
    Zotero.ZotURead.Logger.log('close');
    win.removeEventListener('close', funcclose);

    if (close) {
      close();
    }
  }
  let innerFunc = function () {
    Zotero.ZotURead.Logger.log('pageshow');
    browser.removeEventListener('pageshow', innerFunc);
    let doc = browser.contentDocument;
    Zotero.ZotURead.Logger.log(doc);
    
    doc.getElementById('head').hidden = true;
    doc.querySelector('.loginTit').innerHTML = '<img src="http://www.ucdrs.superlib.net/areas/ucdrs/images/logo.jpg" />';
    if (doc.getElementById('userName')) {
      doc.getElementById('userName').focus();
    }
    if (doc.cookie.indexOf('userName_dsr=') > 0) {
      win.removeEventListener('close', funcclose);
      win.close();

      if (logined) {
        logined(doc);
      }
    }
  }
  win.addEventListener('load', func);
  win.addEventListener('close', funcclose);
}
