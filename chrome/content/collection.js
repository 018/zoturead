Services.scriptloader.loadSubScript('chrome://zoterouread/content/utils.js')

let collection = {
}

collection.initCollection = function () {
  // var libraryID = Zotero.Libraries.userLibraryID;
  // Zotero.Collections.getByParent(Zotero.Collections.getIDFromLibraryAndKey(Zotero.Libraries.userLibraryID, 'ZIJLEJZV'))
  let collection = ZoteroPane.getSelectedCollection()
  if (!collection) {
    Zotero.ZotuRead.Utils.warning('请选择需要初始化的图书根目录。')
    return
  }
  Zotero.showZoteroPaneProgressMeter('正在获取学科列表数据 ...')
  let name
  if (/^\d+\. /g.exec(collection.name)) {
    name = collection.name.replace(/\..+/g, '')
  } else {
    name = 'ROOT'
  }
  Zotero.HTTP.doGet('http://api.uread.today/master/anon/subject/list?p=' + name, async function (request) {
    Zotero.hideZoteroPaneOverlays()
    if (request.status === 200) {
      let json = JSON.parse(request.responseText)
      if (json && json.resultcode === 1 && json.data.length > 0) {
        let exists = 0
        let io = {
          dataIn: []
        }
        for (let index = 0; index < json.data.length; index++) {
          const element = json.data[index]
          io.dataIn.push({
            id: element.code,
            label: `${element.code}. ${element.name}`,
            name: element.name,
            checked: true
          })
        }

        window.openDialog('chrome://zoterouread/content/selectItems.xul', 'selectItems', 'chrome,modal,centerscreen,scrollbars', io)
        var _this = this
        if (io.dataOut) {
          io.dataOut.forEach(async function (element) {
            let code = element.id
            let name = element.name

            let ret = await _this.searchCollection(collection.key, code, name)
            Zotero.debug('uRead@parentKey: ' + ret.collection + ', added: ' + ret.added)
            if (!ret.added) {
              exists++
              Zotero.debug('uRead@exists: ' + exists)
            }
            //element.children.forEach(async function (c) {
            //  await this._newCollection(subcollection.key, `${c.code}. ${c.name}`)
            //}.bind(this))
          })

          Zotero.debug('uRead@exists: ' + exists)
          if (exists === io.dataOut.length) {
            Zotero.ZotuRead.Utils.warning(`${collection.name}所有子学科都已经存在，无需新增。`)
          } else if (exists === 0) {
            Zotero.ZotuRead.Utils.success(`${collection.name}成功新增${io.dataOut.length}个子学科。`)
          } else {
            Zotero.ZotuRead.Utils.success(`${collection.name}成功新增${io.dataOut.length - exists}个子学科，有${exists}已经存在。`)
          }
        }
      } else {
        Zotero.ZotuRead.Utils.warning(`${collection.name}无子学科。`)
      }
    } else if (request.status === 0) {
      Zotero.ZotuRead.Utils.warning(`${request.status} - 网络错误。`)
    } else {
      Zotero.ZotuRead.Utils.warning(`${request.status} - ${request.statusText}`)
    }
  }.bind(this))
}

collection.initClcCollection = function () {
  // var libraryID = Zotero.Libraries.userLibraryID;
  // Zotero.Collections.getByParent(Zotero.Collections.getIDFromLibraryAndKey(Zotero.Libraries.userLibraryID, 'ZIJLEJZV'))
  let collection = ZoteroPane.getSelectedCollection()
  if (!collection) {
    Zotero.ZotuRead.Utils.warning('请选择需要初始化的图书根目录。')
    return
  }
  Zotero.showZoteroPaneProgressMeter('正在获取中图分类数据 ...')
  let name
  if (/^[A-Z][A-Z0-9-]*\. /g.exec(collection.name)) {
    name = collection.name.replace(/\..+/g, '')
  } else {
    name = 'ROOT'
  }
  Zotero.HTTP.doGet('http://api.uread.today/master/anon/ch_lib_cls/list?p=' + name, async function (request) {
    Zotero.hideZoteroPaneOverlays()
    if (request.status === 200) {
      let json = JSON.parse(request.responseText)
      if (json && json.resultcode === 1 && json.data.length > 0) {
        let exists = 0
        let io = {
          dataIn: []
        }
        for (let index = 0; index < json.data.length; index++) {
          const element = json.data[index]
          io.dataIn.push({
            id: element.code,
            label: `${element.code}. ${element.name}`,
            name: element.name,
            checked: true
          })
        }

        window.openDialog('chrome://zoterouread/content/selectItems.xul', 'selectItems', 'chrome,modal,centerscreen,scrollbars', io)
        var _this = this
        if (io.dataOut) {
          io.dataOut.forEach(async function (element) {
            let code = element.id
            let name = element.name

            let ret = await _this.searchCollection(collection.key, code, name)
            Zotero.debug('uRead@parentKey: ' + ret.collection + ', added: ' + ret.added)
            if (!ret.added) {
              exists++
              Zotero.debug('uRead@exists: ' + exists)
            }
            //element.children.forEach(async function (c) {
            //  await this._newCollection(subcollection.key, `${c.code}. ${c.name}`)
            //}.bind(this))
          })

          Zotero.debug('uRead@exists: ' + exists)
          if (exists === io.dataOut.length) {
            Zotero.ZotuRead.Utils.warning(`${collection.name}所有子中图分类都已经存在，无需新增。`)
          } else if (exists === 0) {
            Zotero.ZotuRead.Utils.success(`${collection.name}成功新增${io.dataOut.length}个子中图分类。`)
          } else {
            Zotero.ZotuRead.Utils.success(`${collection.name}成功新增${io.dataOut.length - exists}个子中图分类，有${exists}已经存在。`)
          }
        }
      } else {
        Zotero.ZotuRead.Utils.warning(`${collection.name}无子中图分类。`)
      }
    } else if (request.status === 0) {
      Zotero.ZotuRead.Utils.warning(`${request.status} - 网络错误。`)
    } else {
      Zotero.ZotuRead.Utils.warning(`${request.status} - ${request.statusText}`)
    }
  }.bind(this))
}

collection.selectnoncollection = function () {
  Zotero.Items.getAll(1, true, false).then((rets) => {
    let ids = []
    rets.forEach(e => {
      if (e.getCollections().length === 0) {
        ids.push(e.id)
      }
    })
    if (ids.length === 0) {
      Zotero.ZotuRead.Utils.success(`恭喜你，所有条目都已归档。`)
    } else {
      ZoteroPane.selectItems(ids, 1)
    }
  })
}

collection.loopSearchCollection = function (parentKey, subjectcode) {
  var collections
  var libraryID = ZoteroPane.getSelectedLibraryID()
  if (parentKey) {
    let parent = Zotero.Collections.getIDFromLibraryAndKey(libraryID, parentKey)
    collections = Zotero.Collections.getByParent(parent)
  } else {
    collections = Zotero.Collections.getByLibrary(libraryID)
  }

  for (let index = 0; index < collections.length; index++) {
    const element = collections[index]
    if (new RegExp('^' + subjectcode + '\\. ').exec(element.name)) {
      return element
    }
    Zotero.debug(`uRead@forEach: ${element.name}`)

    let collection = this.loopSearchCollection(element.key, subjectcode)
    if (collection) {
      Zotero.debug(`uRead@searchCollection: ${collection.id} ${collection.name}`)
      return collection
    }
  }
}

collection.searchCollection = async function (parentKey, subjectcode, subjectname) {
  var collections
  var libraryID = ZoteroPane.getSelectedLibraryID()
  if (parentKey) {
    let parent = Zotero.Collections.getIDFromLibraryAndKey(libraryID, parentKey)
    collections = Zotero.Collections.getByParent(parent)
  } else {
    return
  }

  let collection
  for (let index = 0; index < collections.length; index++) {
    const element = collections[index]

    if (new RegExp('^' + subjectcode + '\\. ').exec(element.name)) {
      collection = element
      break
    }
  }

  let added = false
  if (!collection) {
    collection = await this._newCollection(parentKey, subjectcode, subjectname)
    Zotero.debug(`uRead@_newCollection: ${collection.id} ${collection.name}`)
    added = true
  } else {
    added = false
  }

  return { collection: collection, added: added }
}

collection._newCollection = async function (parentKey, subjectcode, subjectname) {
  var libraryID = ZoteroPane.getSelectedLibraryID()
  if (!Zotero.Libraries.get(libraryID).editable) {
    return false
  }

  var collection = new Zotero.Collection
  collection.libraryID = libraryID
  collection.name = `${subjectcode}. ${subjectname}`
  collection.parentKey = parentKey
  await collection.saveTx()
  return collection
}

if (typeof window !== 'undefined') {
  // API export for Zotero UI
  // Can't imagine those to not exist tbh
  if (!window.Zotero) window.Zotero = {}
  if (!window.Zotero.uRead) window.Zotero.uRead = {}
  if (!window.Zotero.uRead.Collection) window.Zotero.uRead.Collection = {}
  // note sure about any of this

  window.Zotero.uRead.Collection.initCollection = function () { collection.initCollection() }
  window.Zotero.uRead.Collection.initClcCollection = function () { collection.initClcCollection() }
  window.Zotero.uRead.Collection.selectnoncollection = function () { collection.selectnoncollection() }

  window.Zotero.uRead.Collection.loopSearchCollection = function (parentKey, subjectcode) { return collection.loopSearchCollection(parentKey, subjectcode) }
  window.Zotero.uRead.Collection.searchCollection = async function (parentKey, subjectcode, subjectname) {
    let ret = await collection.searchCollection(parentKey, subjectcode, subjectname)
    return ret
  }
} else {
  Zotero.debug('uRead@window is null.')
}

if (typeof module !== 'undefined') module.exports = collection
