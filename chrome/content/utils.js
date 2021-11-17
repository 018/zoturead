if (!window.Zotero) window.Zotero = {}
if (!window.Zotero.ZotuRead) window.Zotero.ZotuRead = {}
if (!window.Zotero.ZotuRead.Utils) window.Zotero.ZotuRead.Utils = {}

window.Zotero.ZotuRead.Utils = {
  _bundle: Cc['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService).createBundle('chrome://zoterouread/locale/uread.properties')
}

window.Zotero.ZotuRead.Utils.warning = function (message) {
  Zotero.alert(null, Zotero.getString('general.warning'), message)
}

window.Zotero.ZotuRead.Utils.success = function (message) {
  Zotero.alert(null, Zotero.getString('general.success'), message)
}

window.Zotero.ZotuRead.Utils.error = function (message) {
  Zotero.alert(null, Zotero.getString('general.error'), message)
}

window.Zotero.ZotuRead.Utils.getParam = function (url, name) {
  if (!url) return ''

  var src = new RegExp('[?&]' + name + '=([^&#]*)').exec(url)

  /* eslint-disable no-undef */
  return src && src[1] ? src[1] : ''
}

window.Zotero.ZotuRead.Utils.eqisbn = function (val1, val2) {
  if (!val1 || (val1.length !== 13 && val1.length !== 10) || !val2 || (val2.length !== 13 && val2.length !== 10)) return false

  let no1 = this.getISBNNo(val1)
  let no2 = this.getISBNNo(val2)
  return no1 === no2
}

window.Zotero.ZotuRead.Utils.getISBNNo = function (val) {
  if (!val || (val.length !== 13 && val.length !== 10)) return

  if (val.length === 13) {
    return val.substr(3, 9)
  } else if (val.length === 10) {
    return val.substr(0, 9)
  }
}

window.Zotero.ZotuRead.Utils.opt = function (val) {
  if (!val) return ''

  if (val instanceof Array) {
    if (val.length > 0) {
      return val[0]
    }
  } else {
    return val
  }
}

window.Zotero.ZotuRead.Utils.getString = function (name, ...params) {
  if (params !== undefined && params.length > 0) {
    return this._bundle.formatStringFromName(name, params, params.length)
  } else {
    return this._bundle.GetStringFromName(name)
  }
}

window.Zotero.ZotuRead.Utils.getSelectedItems = function (itemType) {
  var zitems = window.ZoteroPane.getSelectedItems()
  if (!zitems.length) {
    Zotero.debug('window.Zotero.ZotuRead.Utils@zitems.length: ' + zitems.length)
    return false
  }

  if (itemType) {
    if (!Array.isArray(itemType)) {
      itemType = [itemType]
    }
    var siftedItems = this.siftItems(zitems, itemType)
    Zotero.debug('window.Zotero.ZotuRead.Utils@siftedItems.matched: ' + siftedItems.matched.length)
    return siftedItems.matched
  } else {
    return zitems
  }
}

window.Zotero.ZotuRead.Utils.siftItems = function (itemArray, itemTypeArray) {
  var matchedItems = []
  var unmatchedItems = []
  while (itemArray.length > 0) {
    if (this.checkItemType(itemArray[0], itemTypeArray)) {
      matchedItems.push(itemArray.shift())
    } else {
      unmatchedItems.push(itemArray.shift())
    }
  }

  return {
    matched: matchedItems,
    unmatched: unmatchedItems
  }
}

window.Zotero.ZotuRead.Utils.checkItemType = function (itemObj, itemTypeArray) {
  var matchBool = false

  for (var idx = 0; idx < itemTypeArray.length; idx++) {
    switch (itemTypeArray[idx]) {
      case 'attachment':
        matchBool = itemObj.isAttachment()
        break
      case 'note':
        matchBool = itemObj.isNote()
        break
      case 'regular':
        matchBool = itemObj.isRegularItem()
        break
      default:
        matchBool = Zotero.ItemTypes.getName(itemObj.itemTypeID) === itemTypeArray[idx]
    }

    if (matchBool) {
      break
    }
  }

  return matchBool
}

window.Zotero.ZotuRead.Utils.loadDocumentAsync = async function (url, onDone, onError, dontDelete, cookieSandbox) {
  let doc = await new Zotero.Promise(function (resolve, reject) {
    var browser = Zotero.HTTP.loadDocuments(url,
      Zotero.Promise.coroutine(function* () {
        try {
          resolve(browser.contentDocument)
        } catch (e) {
          reject(e)
        } finally {
          Zotero.Browser.deleteHiddenBrowser(browser)
        }
      }),
      onDone,
      onError,
      dontDelete,
      cookieSandbox
    )
  })
  return doc
}

window.Zotero.ZotuRead.Utils.requestAsync = async function (url, config) {
  var xmlhttp = await Zotero.HTTP.request('GET', url, config)
  return xmlhttp
}

window.Zotero.ZotuRead.Utils.htmlToText = function (html) {
  var	nsIFC = Components.classes['@mozilla.org/widget/htmlformatconverter;1'].createInstance(Components.interfaces.nsIFormatConverter)
  var from = Components.classes['@mozilla.org/supports-string;1'].createInstance(Components.interfaces.nsISupportsString)
  from.data = html
  var to = { value: null }
  try {
    nsIFC.convert('text/html', from, from.toString().length, 'text/unicode', to, {})
    to = to.value.QueryInterface(Components.interfaces.nsISupportsString)
    return to.toString()
  } catch (e) {
    Zotero.debug(e, 1)
    return html
  }
}

window.Zotero.ZotuRead.Utils.newCatalogue = async function (item, coverUrl, catalogue, title) {
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
    note.libraryID = ZoteroPane.getSelectedLibraryID()
    noteID = await note.saveTx()
  }
  note.setNote(notes)
  Zotero.debug('note.id: ' + noteID)
  ZoteroPane.selectItem(noteID)
}
