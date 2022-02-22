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
    let checkbox = document.createElement('checkbox')
    checkbox.setAttribute('id', element.id)
    checkbox.setAttribute('item-index', index)
    checkbox.setAttribute('label', element.label)
    checkbox.setAttribute('checked', element.checked)
    document.getElementById('items').append(checkbox)
  })
  window.sizeToContent()
}

function ok () {
  var dataOut = []
  document.querySelectorAll('#items checkbox').forEach(checkbox => {
    if (checkbox.checked) {
      let index = parseInt(checkbox.getAttribute('item-index'))
      dataOut.push(io.dataIn.items[index])
    }
  })
  if (dataOut.length > 0) {
    io.dataOut = dataOut
    window.close()
  }
}

function selectall () {
  document.querySelectorAll('#items checkbox').forEach(checkbox => {
    checkbox.setAttribute('checked', true)
  })
}

function unselectall () {
  document.querySelectorAll('#items checkbox').forEach(checkbox => {
    checkbox.setAttribute('checked', false)
  })
}
