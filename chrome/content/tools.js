Services.scriptloader.loadSubScript('chrome://zoterouread/content/utils.js')

let tools = {
}

tools.expandSelectedRows = function () {
  //ZoteroPane.itemsView.expandSelectedRows()
  let items = ZoteroPane.getSelectedItems()
  for (let i = 0; i < items.length; i++) {
    let index = ZoteroPane.getSortedItems().indexOf(items[i])
    ZoteroPane.itemsView.toggleOpenState(index, true)
  }
}

tools.collapseSelectedRows = function () {
  ZoteroPane.itemsView.collapseSelectedRows()
}

tools.clearupAuthor = function (pw) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
    pw.show()
    Zotero.debug(pw)
  }

  for (const zitem of zitems) {
    Zotero.debug(zitem)

    var creators = zitem.getCreators()
    if (creators) {
      for (const creator of creators) {
        Zotero.debug('uRead@creator: ' + JSON.stringify(creator))
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
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
  }
}

tools.clearupExtra1 = function (pw) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
    pw.show()
    Zotero.debug(pw)
  }

  for (const zitem of zitems) {
    Zotero.debug(zitem)

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
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
  }
}

tools.clearupExtra2 = function (pw) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
    pw.show()
    Zotero.debug(pw)
  }

  for (const zitem of zitems) {
    Zotero.debug(zitem)

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
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
  }
}

tools.clearuptags = function (pw) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
    pw.show()
    Zotero.debug(pw)
  }

  for (const zitem of zitems) {
    Zotero.debug(zitem)
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
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
  }
}

tools.clearupTitle = function (pw) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
    pw.show()
    Zotero.debug(pw)
  }

  for (const zitem of zitems) {
    Zotero.debug(zitem)
    var title = zitem.getField('title') || ''
    var _title = title.replace(/[\(|（](.*?)[\)|）]/g, '($1)')
    Zotero.debug(_title + ' >>> ' + title)
    if (title !== _title) {
      zitem.setField('title', _title)
      pw.addLines(title + ' >>> ' + _title, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    } else {
      pw.addLines(title + '无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
  }
}

tools.clearupAbstractNote = function (pw) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
    pw.show()
    Zotero.debug(pw)
  }

  for (const zitem of zitems) {
    Zotero.debug(zitem)

    var abstractNote = zitem.getField('abstractNote') || ''
    var _abstractNote = abstractNote.replace(/•/g, '·')
    Zotero.debug(_abstractNote + ' >>> ' + abstractNote)
    if (abstractNote !== _abstractNote) {
      zitem.setField('abstractNote', _abstractNote)
      pw.addLines('简介', `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    } else {
      pw.addLines('简介无需处理', `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    }
    zitem.saveTx()
  }
  if (!srcPw) {
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
  }
}

tools.mergecatalog = function (pw) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let srcPw = pw
  if (!srcPw) {
    pw = new Zotero.ProgressWindow()
    pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
    pw.show()
    Zotero.debug(pw)
  }

  for (const zitem of zitems) {
    Zotero.debug(zitem)
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
    pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
  }
}

tools.mergename = function () {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
  pw.show()
  Zotero.debug(pw)

  for (const zitem of zitems) {
    Zotero.debug(zitem)

    let ret = false
    var creators = zitem.getCreators()
    if (creators) {
      for (const creator of creators) {
        Zotero.debug('uRead@creator: ' + JSON.stringify(creator))
        if (creator.lastName !== creator.firstName) {
          creator.lastName = creator.lastName + creator.firstName
        }
        creator.firstName = ''
        ret = true
      }
    }
    zitem.setCreators(creators)
    zitem.saveTx()

    if (ret) {
      pw.addLines(`${zitem.getField('title')} 作者合并成功。`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
    }
  }
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
}

tools.clearupall = function () {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  var pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.clearup'))
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
  pw.show()

  this.clearupAuthor(pw)
  this.clearupExtra1(pw)
  this.clearupExtra2(pw)
  this.clearupTitle(pw)
  this.clearupAbstractNote(pw)
  this.clearuptags(pw)
  this.mergecatalog(pw)

  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
}

tools.fixclc = function () {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let item = zitems[0]
  this._fixclc(item, (clc) => {
  })
}

tools.fixsubject = async function () {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.fix'))
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
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
      Zotero.debug('uRead@ret: ' + request.responseText)
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
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
}

tools.movearchive = async function () {
  await this._archive(true)
}

tools.archive = async function () {
  await this._archive(false)
}

tools.movearchivebyclc = async function () {
  await this._archivebyclc(true)
}

tools.archivebyclc = async function () {
  await this._archivebyclc(false)
}

tools._archivebyclc = async function (overlay) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.archive'))
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
  pw.show()

  for (const zitem of zitems) {
    let clc = zitem.getField('archiveLocation')
    if (!clc) {
      pw.addLines(`${zitem.getField('title')}，请先修复中图分类信息。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
    } else {
      let request = await this._clcinfo(clc)
      if (request.status === 200) {
        Zotero.debug('uRead@doGet: ' + request.responseText)
        let json = JSON.parse(request.responseText)
        if (json && json.resultcode === 1) {
          let clcObj = json.data.clc
          if (json.data.clc) {
            let clcs = [...clcObj.parents]
            clcs.push(clcObj)
            Zotero.debug('uRead@clcs: ' + clcs.length)

            let collection = Zotero.uRead.Collection.loopSearchCollection(undefined, clcs[0].code)
            if (!collection) {
              // 未找到
              Zotero.debug('uRead@未找到: ' + index)
              pw.addLines(`${zitem.getField('title')}，未找到${clcs[0].code}的学科目录。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
            } else {
              for (let index = 1; index < clcs.length; index++) {
                const element = clcs[index]
                let code = element.code
                let name = element.name
                let ret = await Zotero.uRead.Collection.searchCollection(collection.key, code, name)
                collection = ret.collection
                Zotero.debug(`uRead@Zotero.uRead.Collection.searchCollection: ${collection.id}`)
              }

              let collections = []
              if (!overlay) {
                collections.push(...zitem.getCollections())
              }
              Zotero.debug(`uRead@collections: ${collections.join(',')}`)
              collections.push(collection.id)
              Zotero.debug(`uRead@collections: ${collections.join(',')}`)
              zitem.setCollections(collections)
              zitem.setField('archiveLocation', clcObj.code)
              await zitem.saveTx()
              pw.addLines(`${zitem.getField('title')} 已归档至 ${Zotero.uRead.Tools.showPath(collection.id)}`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
            }
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
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
}

tools._clcinfo = async function (clc) {
  let request = await Zotero.HTTP.request(
    'GET',
    'http://api.uread.today/master/anon/ch_lib_cls/info?code=' + clc,
    {
      noCache: true,
      responseType: 'text'
    }
  )
  if (request.status === 200) {
    Zotero.debug('uRead@doGet: ' + request.responseText)
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

tools._archive = async function (overlay) {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems(['book'])
  if (!zitems || zitems.length <= 0) {
    Zotero.ZotuRead.Utils.warning(Zotero.ZotuRead.Utils.getString('uread.nonsupport'))
    return
  }
  Zotero.debug('uRead@zitems.length: ' + zitems.length)

  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.archive'))
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.choose', zitems.length))
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
          Zotero.debug('uRead@doGet: ' + request.responseText)
          let json = JSON.parse(request.responseText)
          if (json && json.resultcode === 1) {
            let subjectObj = json.data.subject
            if (json.data.subject) {
              let subjects = [...subjectObj.parents]
              subjects.push(subjectObj)
              Zotero.debug('uRead@subjects: ' + subjects.length)

              let collection = Zotero.uRead.Collection.loopSearchCollection(undefined, subjects[0].code)
              if (!collection) {
                // 未找到
                Zotero.debug('uRead@未找到: ' + index)
                pw.addLines(`${zitem.getField('title')}，未找到${subjects[0].code}的学科目录。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
              } else {
                for (let index = 1; index < subjects.length; index++) {
                  const element = subjects[index]
                  let code = element.code
                  let name = element.name
                  let ret = await Zotero.uRead.Collection.searchCollection(collection.key, code, name)
                  collection = ret.collection
                  Zotero.debug(`uRead@Zotero.uRead.Collection.searchCollection: ${collection.id}`)
                }

                let collections = []
                if (!overlay) {
                  collections.push(...zitem.getCollections())
                }
                Zotero.debug(`uRead@collections: ${collections.join(',')}`)
                collections.push(collection.id)
                Zotero.debug(`uRead@collections: ${collections.join(',')}`)
                zitem.setCollections(collections)
                zitem.setField('archive', subjectObj.code)
                await zitem.saveTx()
                pw.addLines(`${zitem.getField('title')} 已归档至 ${Zotero.uRead.Tools.showPath(collection.id)}`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
              }
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
        Zotero.debug('uRead@request: ' + request.response)
        let json = JSON.parse(request.response)
        if (json) {
          if (json.resultcode === 1) {
            let subjectObj = json.data.subject
            if (json.data.subject) {
              let subjects = [...subjectObj.parents]
              subjects.push(subjectObj)
              Zotero.debug('uRead@subjects: ' + subjects.length)

              let collection = Zotero.uRead.Collection.loopSearchCollection(undefined, subjects[0].code)
              if (!collection) {
                // 未找到
                Zotero.debug('uRead@未找到: ' + collection)
                pw.addLines(`${zitem.getField('title')}，未找到${subjects[0].code}的学科目录。`, `chrome://zotero/skin/warning${Zotero.hiDPISuffix}.png`)
              } else {
                for (let index = 1; index < subjects.length; index++) {
                  const element = subjects[index]
                  let code = element.code
                  let name = element.name
                  let ret = await Zotero.uRead.Collection.searchCollection(collection.key, code, name)
                  collection = ret.collection
                  Zotero.debug(`uRead@Zotero.uRead.Collection.searchCollection: ${collection.id}`)
                }

                let collections = []
                if (!overlay) {
                  collections.push(...zitem.getCollections())
                }
                Zotero.debug(`uRead@collections: ${collections.join(',')}`)
                collections.push(collection.id)
                Zotero.debug(`uRead@collections: ${collections.join(',')}`)
                zitem.setCollections(collections)
                await zitem.saveTx()
                pw.addLines(`${zitem.getField('title')} 已归档至 ${Zotero.uRead.Tools.showPath(collection.id)}`, `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`)
              }
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
  pw.addDescription(Zotero.ZotuRead.Utils.getString('uread.click_on_close'))
}

tools.location = function (collectionID, itemID) {
  ZoteroPane.collectionsView.selectCollection(collectionID)
  ZoteroPane.selectItem(itemID)
}

tools.showPath = function (collectionID) {
  let collectionNames = []
  collectionNames.push(Zotero.Collections.get(collectionID).name)
  let parentID = collectionID
  while ((parentID = Zotero.Collections.get(parentID).parentID)) {
    collectionNames.push(Zotero.Collections.get(parentID).name)
  }
  return collectionNames.reverse().join(' ▸ ')
}

tools._parsing = function (author) {
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

tools._fixclc = function (item, callback) {
  var isbn = item.getField('ISBN').replace(/-/g, '')
  let pw = new Zotero.ProgressWindow()
  pw.changeHeadline(Zotero.ZotuRead.Utils.getString('uread.title.fix'))
  pw.show()
  let itemProgress = new pw.ItemProgress(
    `chrome://zotero/skin/spinner-16px${Zotero.hiDPISuffix}.png`,
    `${item.getField('title')}`
  )
  itemProgress.setProgress(50)
  Zotero.HTTP.loadDocuments('http://book.ucdrs.superlib.net/', function (doc) {
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
        Zotero.debug('books.length: 0, ' + doc.body.innerHTML)
        return
      }
      let found = false
      for (let book of books) {
        if (found) {
          break
        }
        let a = book.querySelector('.book1 td>table a.px14')
        if (a) {
          Zotero.debug('a.href: ' + a.href)
          // superlib 单本书籍查看
          var url1 = a.href.replace('chrome://zotero', 'http://book.ucdrs.superlib.net')
          await Zotero.HTTP.loadDocuments(url1, async function (doc1) {
            let tubox = doc1.querySelector('.tubox dl').textContent
            let isbn1 = Zotero.ZotuRead.Utils.opt(/【ISBN号】.*\n/.exec(tubox)).replace(/【ISBN号】|-|\n/g, '')
            Zotero.debug('isbn eqisbn: ' + isbn + ' - ' + isbn1)
            if (Zotero.ZotuRead.Utils.eqisbn(isbn, isbn1)) {
              let clc = Zotero.ZotuRead.Utils.opt(Zotero.ZotuRead.Utils.opt(/【中图法分类号】.*\n/.exec(tubox)).match(/[a-zA-Z0-9\.;]+/))
              if (clc) {
                Zotero.debug('clc: ' + clc)
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
          })
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
    })
  }.bind(this),
  null,
  function (e) {
    itemProgress.setIcon(`chrome://zotero/skin/cross${Zotero.hiDPISuffix}.png`)
    itemProgress.setProgress(100)
    itemProgress.setText(`${item.getField('title')}，${e}`)
  })
}

if (typeof window !== 'undefined') {
  // API export for Zotero UI
  // Can't imagine those to not exist tbh
  if (!window.Zotero) window.Zotero = {}
  if (!window.Zotero.uRead) window.Zotero.uRead = {}
  if (!window.Zotero.uRead.Tools) window.Zotero.uRead.Tools = {}
  // note sure about any of this
  window.Zotero.uRead.Tools.expandSelectedRows = function () { tools.expandSelectedRows() }
  window.Zotero.uRead.Tools.collapseSelectedRows = function () { tools.collapseSelectedRows() }

  window.Zotero.uRead.Tools.clearupAuthor = function () { tools.clearupAuthor() }
  window.Zotero.uRead.Tools.clearupExtra1 = function () { tools.clearupExtra1() }
  window.Zotero.uRead.Tools.clearupExtra2 = function () { tools.clearupExtra2() }
  window.Zotero.uRead.Tools.clearupTitle = function () { tools.clearupTitle() }
  window.Zotero.uRead.Tools.clearupAbstractNote = function () { tools.clearupAbstractNote() }
  window.Zotero.uRead.Tools.clearuptags = function () { tools.clearuptags() }
  window.Zotero.uRead.Tools.mergecatalog = function () { tools.mergecatalog() }
  window.Zotero.uRead.Tools.clearupall = function () { tools.clearupall() }
  window.Zotero.uRead.Tools.mergename = function () { tools.mergename() }

  window.Zotero.uRead.Tools.fixsubject = function () { tools.fixsubject() }
  window.Zotero.uRead.Tools.fixclc = function () { tools.fixclc() }

  window.Zotero.uRead.Tools.archive = function () { tools.archive() }
  window.Zotero.uRead.Tools.movearchive = function () { tools.movearchive() }
  window.Zotero.uRead.Tools.archivebyclc = function () { tools.archivebyclc() }
  window.Zotero.uRead.Tools.movearchivebyclc = function () { tools.movearchivebyclc() }

  window.Zotero.uRead.Tools.location = function (collectionID, itemID) { tools.location(collectionID, itemID) }

  window.Zotero.uRead.Tools.showPath = function (collectionID) { return tools.showPath(collectionID) }
} else {
  Zotero.debug('uRead@window is null.')
}

if (typeof module !== 'undefined') module.exports = tools
