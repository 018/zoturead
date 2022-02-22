/* Copyright 2021 018.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';
/* global window, document, Components */
/* global Zotero, ZoteroPane, ZOTERO_CONFIG */
Components.utils.import('resource://gre/modules/Services.jsm');

var io = window.arguments && window.arguments.length > 0 ? window.arguments[0] : { dataIn: [] }

io = Object.assign(io, { dataOut: false })

function onload () {
  io.dataIn.items.forEach((element, index) => {
    let radio = document.createElement('radio')
    radio.setAttribute('id', element.id)
    radio.setAttribute('item-index', index)
    radio.setAttribute('label', element.label)
    radio.setAttribute('selected', element.selected)
    document.getElementById('items').appendChild(radio)
  })
  window.sizeToContent()
}

function ok () {
  var dataOut
  document.querySelectorAll('#items radio').forEach(radio => {
    if (radio.selected) {
      let index = parseInt(radio.getAttribute('item-index'))
      dataOut = io.dataIn.items[index]
    }
  })
  if (dataOut) {
    io.dataOut = dataOut
    window.close()
  }
}
