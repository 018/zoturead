'use strict'

function start () {
  var showCover = Zotero.Prefs.get('zoturead.config.show_cover')
  if (showCover === undefined) {
    showCover = true
  }
  document.getElementById('show_cover').checked = showCover
}

function cancel () {
  window.close()
}

function ok () {
  Zotero.Prefs.set('zoturead.config.show_cover', document.getElementById('show_cover').checked)
  window.close()
}

window.addEventListener('load', start)
