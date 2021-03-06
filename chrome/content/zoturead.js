Cu.import("resource://gre/modules/osfile.jsm")
Services.scriptloader.loadSubScript('chrome://zoterouread/content/utils.js')

let uread = {
}

uread.init = function () {
  // Register the callback in Zotero as an item observer
  Zotero.debug('uRead@init ...')

  this.initPrefs()

  if (Zotero.ZotCard.Utils.version() >= 6) {
    Zotero.debug(`zotcard@addListener onSelect: ${Zotero.ZotCard.Utils.version()}`)
    var interval1 = setInterval(() => {
      if (ZoteroPane.itemsView) {
        ZoteroPane.itemsView.onSelect.addListener(this.itemsTreeOnSelect);
        clearInterval(interval1)
      }
    }, 1000);
  } else {
    document.getElementById('zotero-items-tree').addEventListener('select', this.itemsTreeOnSelect.bind(this), false)
  }

  document.getElementById('zotero-itemmenu').addEventListener('popupshowing', this.itemmenuPopupShowing.bind(this), false)
  document.getElementById('zotero-collectionmenu').addEventListener('popupshowing', this.collectionmenuPopupShowing.bind(this), false)

  window.addEventListener('unload', function (e) {
    document.getElementById('zotero-itemmenu').removeEventListener('popupshowing', this.itemmenuPopupShowing.bind(this), false)
    document.getElementById('zotero-collectionmenu').removeEventListener('popupshowing', this.collectionmenuPopupShowing.bind(this), false)
    
    if (Zotero.ZotCard.Utils.version() >= 6) {
      ZoteroPane.itemsView.onSelect.removeListener(this.itemsTreeOnSelect);
    } else {
      document.getElementById('zotero-items-tree').removeEventListener('select', this.itemsTreeOnSelect.bind(this), false)
    }
  }.bind(this), false)
}

uread.initPrefs = function () {
  var showCover = Zotero.Prefs.get('zoturead.config.show_cover')
  if (showCover === undefined) {
    showCover = true
    Zotero.Prefs.set('zoturead.config.show_cover', showCover)
  }
}

uread.itemsTreeOnSelect = function (e) {
  var showCover = Zotero.Prefs.get('zoturead.config.show_cover')
  var hidden = false
  if (showCover) {
    var zitems = Zotero.ZotuRead.Utils.getSelectedItems('book')
    if (zitems.length === 1) {
      let item = zitems[0]
      let notes = Zotero.Items.get(item.getNotes())
      let p = document.getElementById('cover-wrap')
      if (!p) {
        p = document.createElement('p')
        p.setAttribute('id', 'cover-wrap')
        p.style.textAlign = 'center'
        p.style.width = '100%'
        p.style.margin = '10px'
        let image = document.createElement('image')
        image.setAttribute('id', 'cover-image')
        image.style.maxWidth = '135px'
        image.style.maxHeight = '150px'
        p.append(image)
        document.getElementById('zotero-editpane-item-box').parentElement.prepend(p)
        document.getElementById('zotero-editpane-item-box').parentElement.style.display = 'flex'
        document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = 'column'
        document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = 'stretch'
      }
      let src
      for (const note of notes) {
        if (note.getNoteTitle() === '??????') {
          let match = note.getNote().match(/src=".*?"/g)
          if (match) {
            src = match[0].replace('src=', '').replace('"', '')
            break
          }
        }
      }
      let image = document.getElementById('cover-image')
      if (src) {
        image.setAttribute('src', src)
        p.hidden = false
        document.getElementById('zotero-editpane-item-box').parentElement.style.display = 'flex'
        document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = 'column'
        document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = 'stretch'
      } else {
        p.hidden = true
        document.getElementById('zotero-editpane-item-box').parentElement.style.display = ''
        document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = ''
        document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = ''
      }
    } else {
      hidden = true
    }
  } else {
    hidden = true
  }

  if (hidden) {
    let p = document.getElementById('cover-wrap')
    if (p) {
      p.hidden = true
      document.getElementById('zotero-editpane-item-box').parentElement.style.display = ''
      document.getElementById('zotero-editpane-item-box').parentElement.style.flexDirection = ''
      document.getElementById('zotero-editpane-item-box').parentElement.style.alignItems = ''
    }
  }
}

uread.collectionmenuPopupShowing = function () {
  let disabled = false
  var libraryID = ZoteroPane.getSelectedLibraryID()
  if (!Zotero.Libraries.get(libraryID).editable) {
    disabled = true
  } else {
    let collection = ZoteroPane.getSelectedCollection()
    if (collection) {
      if (/^\d{3,7}\. /g.exec(collection.name)) {
        document.getElementById('zotero-collectionmenu-uread-initCollection').label = `?????? ${collection.name} ???????????????`
      } else {
        document.getElementById('zotero-collectionmenu-uread-initCollection').label = `??????????????????`
      }
      if (/^[A-Z][A-Z0-9-]*\. /g.exec(collection.name)) {
        document.getElementById('zotero-collectionmenu-uread-initClcCollection').label = `?????? ${collection.name} ???????????????`
      } else {
        document.getElementById('zotero-collectionmenu-uread-initClcCollection').label = `??????????????????`
      }
    } else {
      disabled = true
    }
  }

  document.getElementById('zotero-collectionmenu-uread-selectnoncollection').hidden = ZoteroPane.getSelectedCollection()
  document.getElementById('zotero-collectionmenu-uread-initCollection').disabled = disabled
  document.getElementById('zotero-collectionmenu-uread-initClcCollection').disabled = disabled
}

uread.itemmenuPopupShowing = function () {
  var zitems = Zotero.ZotuRead.Utils.getSelectedItems('book')
  var mutiBook = zitems && zitems.length > 0
  var singleBook = zitems && zitems.length === 1
  var single = ZoteroPane.getSelectedItems().length === 1
  Zotero.debug('zoturead@itemmenuPopupShowing single is ' + single)

  document.querySelectorAll('.single-select-book').forEach(element => {
    element.disabled = !singleBook
  })
  document.querySelectorAll('.muti-select-book').forEach(element => {
    element.disabled = !mutiBook
  })
  document.querySelectorAll('.dynamic-author').forEach(element => {
    element.remove()
  })
  document.querySelectorAll('.dynamic-location').forEach(element => {
    element.remove()
  })
  document.querySelectorAll('.single-select').forEach(element => {
    element.disabled = !single
  })

  if (singleBook) {
    let zitem = zitems[0]
    let url = zitem.getField('url')
    let clc = zitem.getField('archiveLocation')
    let subject = zitem.getField('archive')
    let publisher = zitem.getField('publisher')
    let isbn = zitem.getField('ISBN').replace(/-/g, '')
    document.querySelectorAll('.isbn').forEach(element => {
      element.label = `?????? ${isbn} ??????`
    })
    let title = zitem.getField('title')
    document.querySelectorAll('.title').forEach(element => {
      element.label = `?????? ${title.replace(/??????.*$/g, '').replace(/\(.*\)$/g, '')} ??????`
    })
    let series = zitem.getField('series')
    document.querySelectorAll('.series').forEach(element => {
      element.disabled = !series
      element.label = `?????? ${series ? series : '??????'} ??????`
    })
    document.getElementById('zotero-itemmenu-uread-clcinfo').disabled = !clc
    document.getElementById('zotero-itemmenu-uread-clcinfo').label = clc ? `?????? ${clc} ??????` : '????????????????????????'
    document.getElementById('zotero-itemmenu-uread-subjectinfo').disabled = !subject
    document.getElementById('zotero-itemmenu-uread-subjectinfo').label = subject ? `?????? ${subject} ??????` : '??????????????????'
    if (!Zotero.uRead.Site.checkUrl(url)) {
      // ?????????????????????
      document.getElementById('zotero-itemmenu-uread-restoretranslate').disabled = true
      document.getElementById('zotero-itemmenu-uread-embody').hidden = false
      document.getElementById('zotero-itemmenu-uread-refresh').hidden = true

      document.getElementById('zotero-itemmenu-uread-publisherinfo').disabled = !publisher
      document.getElementById('zotero-itemmenu-uread-publisherinfo').label = `?????? ${publisher ? publisher : '?????????'} ??????`
    } else {
      document.getElementById('zotero-itemmenu-uread-restoretranslate').disabled = !Zotero.ZotuRead.Utils.getParam(url, 'src')
      document.getElementById('zotero-itemmenu-uread-embody').hidden = true
      document.getElementById('zotero-itemmenu-uread-refresh').hidden = false

      document.getElementById('zotero-itemmenu-uread-publisherinfo').disabled = !publisher
      document.getElementById('zotero-itemmenu-uread-publisherinfo').label = `?????? ${publisher ? publisher : '?????????'} ??????`
    }

    let author
    for (const element of zitem.getCreators()) {
      author = element.lastName.replace(/\[.*\]/g, '').replace(/\(.*\)/g, '')

      var authorSubmenu = document.createElement('menuitem')
      authorSubmenu.setAttribute('author', author)
      authorSubmenu.setAttribute('class', 'dynamic-author')
      authorSubmenu.setAttribute('label', `${!Zotero.uRead.Site.checkUrl(url) ? '?????? ' : '?????? '}${author} ??????`)
      authorSubmenu.onclick = function (e) { Zotero.uRead.Site.authorsinfo(e.target.getAttribute('author')) }.bind(this)
      document.getElementById('zotero-itemmenu-uread-publisherinfo').before(authorSubmenu)

      document.querySelectorAll('.series').forEach(function (element) {
        let id = element.getAttribute('id')
        if (id) {
          let searcher = id.replace('zotero-itemmenu-uread-search-', '').replace('-series', '')
          let authorSubmenu = document.createElement('menuitem')
          authorSubmenu.setAttribute('author', author)
          authorSubmenu.setAttribute('class', 'dynamic-author')
          authorSubmenu.setAttribute('label', `?????? ${author} ??????`)
          authorSubmenu.onclick = function (e) { Zotero.uRead.Searcher.searchAuthor(searcher, e.target.getAttribute('author')) }.bind(this)
          element.before(authorSubmenu)
        }
      }.bind(this))
    }

    document.getElementById('zotero-itemmenu-uread-openaschrome').hidden = !Zotero.isMac || !Zotero.File.pathToFile('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome').exists()
  }

  if (single) {
    Zotero.debug('zoturead@selectItem location.')
    let locationdisabled = ZoteroPane.getSelectedItems()[0].getCollections().length === 0
    document.getElementById('zotero-itemmenu-uread-location').disabled = locationdisabled
    if (!locationdisabled) {
      Zotero.debug('zoturead@selectItem locationdisabled is ' + locationdisabled)
      let selectItem = ZoteroPane.getSelectedItems()[0]
      selectItem.getCollections().forEach(collection => {
        Zotero.debug('zoturead@selectItem collection is ' + collection)
        var submenu = document.createElement('menuitem')
        submenu.setAttribute('item-id', selectItem.id)
        submenu.setAttribute('class', 'dynamic-location')
        submenu.setAttribute('collection-id', collection)
        submenu.setAttribute('disabled', ZoteroPane.getSelectedCollection() && ZoteroPane.getSelectedCollection().id === collection)
        let lable = Zotero.uRead.Tools.showPath(collection)
        submenu.setAttribute('label', `${lable}${ZoteroPane.getSelectedCollection() && ZoteroPane.getSelectedCollection().id === collection ? ('(??????)') : ''}`)
        submenu.onclick = function (e) { Zotero.uRead.Tools.location(e.target.getAttribute('collection-id'), e.target.getAttribute('item-id')) }.bind(this)
        document.getElementById('zotero-itemmenu-uread-location-menupopup').appendChild(submenu)
      })
    }
  }
}

uread.config = function () {
  /*Zotero.ZotuRead.Utils.warning(`???????????????about:config????????????????????????
  zoturead.config.show_cover\t\t\t\t????????????????????????????????????????????????
  ...
  
?????????????????????: https://github.com/018/zoturead`)

  Zotero.openInViewer('about:config?filter=zotero.zoturead')*/

  window.openDialog('chrome://zoterouread/content/option.html', 'option', `chrome,dialog,resizable=no,centerscreen,menubar=no`)
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', function (e) { uread.init() }, false)

  // API export for Zotero UI
  // Can't imagine those to not exist tbh
  if (!window.Zotero) window.Zotero = {}
  if (!window.Zotero.uRead) window.Zotero.uRead = {}

  window.Zotero.uRead.config = function () { uread.config() }
  // note sure about any of this
} else {
  Zotero.debug('uRead@window is null.')
}

if (typeof module !== 'undefined') module.exports = uread
