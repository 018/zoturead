if (!window.Utils) {
  window.Utils = {
    _bundle: Cc['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService).createBundle('chrome://zoterouread/locale/uread.properties')
  }

  window.Utils.warning = function (message) {
    Zotero.alert(null, Zotero.getString('general.warning'), message)
  }

  window.Utils.success = function (message) {
    Zotero.alert(null, Zotero.getString('general.success'), message)
  }

  window.Utils.error = function (message) {
    Zotero.alert(null, Zotero.getString('general.error'), message)
  }

  window.Utils.getParam = function (url, name) {
    if (!url) return ''

    var src = new RegExp('[?&]' + name + '=([^&#]*)').exec(url)

    /* eslint-disable no-undef */
    return src && src[1] ? src[1] : ''
  }

  window.Utils.eqisbn = function (val1, val2) {
    if (!val1 || (val1.length !== 13 && val1.length !== 10) || !val2 || (val2.length !== 13 && val2.length !== 10)) return false

    let no1 = this.getISBNNo(val1)
    let no2 = this.getISBNNo(val2)
    return no1 === no2
  }

  window.Utils.getISBNNo = function (val) {
    if (!val || (val.length !== 13 && val.length !== 10)) return

    if (val.length === 13) {
      return val.substr(3, 9)
    } else if (val.length === 10) {
      return val.substr(0, 9)
    }
  }

  window.Utils.opt = function (val) {
    if (!val) return ''

    if (val instanceof Array) {
      if (val.length > 0) {
        return val[0]
      }
    } else {
      return val
    }
  }

  window.Utils.getString = function (name, ...params) {
    if (params !== undefined) {
      return this._bundle.formatStringFromName(name, params, params.length)
    } else {
      return this._bundle.GetStringFromName(name)
    }
  }

  window.Utils.getSelectedItems = function (itemType) {
    var zitems = window.ZoteroPane.getSelectedItems()
    if (!zitems.length) {
      Zotero.debug('window.Utils@zitems.length: ' + zitems.length)
      return false
    }

    if (itemType) {
      if (!Array.isArray(itemType)) {
        itemType = [itemType]
      }
      var siftedItems = this.siftItems(zitems, itemType)
      Zotero.debug('window.Utils@siftedItems.matched: ' + siftedItems.matched.length)
      return siftedItems.matched
    } else {
      return zitems
    }
  }

  window.Utils.siftItems = function (itemArray, itemTypeArray) {
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

  window.Utils.checkItemType = function (itemObj, itemTypeArray) {
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

  window.Utils.loadDocumentAsync = async function (url, onDone, onError, dontDelete, cookieSandbox) {
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

  window.Utils.requestAsync = async function (url) {
    var xmlhttp = await Zotero.HTTP.request('GET', url)
    return xmlhttp
  }

  window.Utils.htmlToText = function (html) {
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
}
